package net.squarelabs.pgrepl.db

import com.codahale.metrics.Counter
import com.codahale.metrics.MetricRegistry.name
import com.google.gson.Gson
import net.squarelabs.pgrepl.messages.TxnMsg
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.*
import org.eclipse.jetty.util.log.Log
import org.postgresql.PGProperty
import org.postgresql.core.BaseConnection
import org.postgresql.replication.LogSequenceNumber
import org.postgresql.replication.PGReplicationStream
import org.postgresql.util.PSQLException
import java.nio.ByteBuffer
import java.sql.DriverManager
import java.util.*
import java.util.concurrent.Executors
import java.util.concurrent.Future
import java.util.concurrent.TimeUnit
import kotlin.collections.HashSet

class Replicator(
        private val dbName: String,
        private val lsn: Long,
        private val cfgSvc: ConfigService,
        private val slotSvc: SlotService,
        private val conSvc: ConnectionService,
        private val crudSvc: CrudService,
        private val cnvSvc: ConverterService,
        val metricSvc: MetricsService
) : AutoCloseable {

    companion object {
        private val LOG = Log.getLogger(Replicator::class.java)
        private var listenerCounter: Counter? = null
        private var walCounter: Counter? = null
    }

    private val id = UUID.randomUUID()
    private val wal = TreeMap<Long, String>()
    private val slotExecutor = Executors.newScheduledThreadPool(1)
    private val listnerExecutor = Executors.newScheduledThreadPool(1)
    private val plugin = "wal2json"
    private val listeners = HashSet<Listener>()
    private var listenerFuture: Future<*>?
    private var con: BaseConnection? = null
    private var stream: PGReplicationStream? = null
    private var slotFuture: Future<*>? = null

    data class Listener constructor(
            val callback: (String) -> Future<Void>,
            var lastResponse: Future<*>?,
            var lsn: Long
    )

    init {
        resubscribe(lsn)
        listenerFuture = slotExecutor.scheduleAtFixedRate({ dispatch() }, 0, 10, TimeUnit.MILLISECONDS)

        synchronized(LOG) {
            if (listenerCounter == null) {
                listenerCounter = metricSvc.getMetrics().counter(name(this.javaClass, "listeners", "size"))
            }
            if (walCounter == null) {
                walCounter = metricSvc.getMetrics().counter(name(this.javaClass, "wal", "size"))
            }
        }
    }

    private fun resubscribe(lsn: Long) {
        slotFuture?.cancel(false)
        con?.close()
        stream?.close()

        val properties = Properties()
        PGProperty.ASSUME_MIN_SERVER_VERSION.set(properties, "9.4")
        PGProperty.REPLICATION.set(properties, "database")
        PGProperty.PREFER_QUERY_MODE.set(properties, "simple")
        val url = cfgSvc.getAppDbUrl() // TODO: Listen to dbName, not cfgService.AppDb
        con = DriverManager.getConnection(url, properties) as BaseConnection

        // Create a slot
        val slotName = "slot_${id.toString().replace("-", "_")}"
        if (!slotSvc.list().contains(slotName)) {
            slotSvc.create(url, slotName, plugin)
            LOG.info("Created slot $slotName @ LSN=$lsn")
        } else {
            LOG.info("Reconnected slot $slotName @ LSN=$lsn")
        }

        // Start listening (https://github.com/eulerto/wal2json/blob/master/wal2json.c)
        stream = createReplicationStream(slotName, lsn)
        slotFuture = slotExecutor.scheduleAtFixedRate({ checkMessages() }, 0, 50, TimeUnit.MILLISECONDS)
    }

    private fun checkMessages() {
        try {
            var buffer = stream!!.readPending()
            val mapper = Gson()
            conSvc.getConnection(cfgSvc.getAppDbUrl()).use { con ->
                while (buffer != null) {
                    val walJson = toString(buffer)
                    cache(mapper, walJson, con, stream!!.lastReceiveLSN)
                    buffer = stream!!.readPending()
                }
            }
        } catch (ex: PSQLException) {
            if ("Database connection failed when reading from copy" != ex.message) {
                LOG.warn("Error reading from database!", ex)
                close()
            }
        } catch (ex: Exception) {
            LOG.warn("Error reading from database!", ex)
            close()
        }
    }

    private fun cache(mapper: Gson, walJson: String, con: BaseConnection, lsn: LogSequenceNumber) {
        val walTxn: Transaction = mapper.fromJson(walJson, Transaction::class.java)
        if (walTxn.change.size <= 0) return // Not sure why this happens
        val txnId = crudSvc.getClientTxnId(walTxn.xid, con)
        val msg = TxnMsg(cnvSvc.walTxnToClientTxn(lsn.asLong(), txnId, walTxn))
        val clientJson = mapper.toJson(msg)
        if(wal.put(lsn.asLong(), clientJson) == null) walCounter!!.inc()
        stream!!.setAppliedLSN(lsn)
        //stream.setFlushedLSN(lsn) // force postgres to hold entire log by not flushing
        // TODO: flush bottom of memory wal if all listeners are caught up
        LOG.info("${wal.size} transactions in cache")
    }

    @Synchronized
    private fun dispatch() {
        if (wal.size == 0) return
        val currentLsn = wal.lastKey()
        var count = 1
        while (count > 0) {
            count = listeners
                    .filter { it.lastResponse == null || it.lastResponse!!.isDone }
                    .filter { it.lsn < currentLsn }
                    .filter { wal.containsKey(it.lsn) } // Don't skip entries if we are loading them from DB
                    .map({
                        it.lsn = wal.higherKey(it.lsn)
                        it.lastResponse = it.callback(wal[it.lsn]!!)
                        it
                    }).count()
        }
    }

    @Synchronized
    fun addListener(lsn: Long, listener: (String) -> Future<Void>) {
        if (wal.size > 0 && lsn < wal.firstKey()) resubscribe(lsn)
        listeners.add(Listener(listener, null, lsn))
        listenerCounter!!.inc()
    }

    @Synchronized
    fun removeListener(listener: (String) -> Future<Void>) {
        if (listeners.removeIf({ it.callback == listener })) listenerCounter!!.dec()
    }

    override fun close() {
        LOG.info("Closing Replicator...")
        slotFuture?.cancel(true)
        slotExecutor.shutdownNow()
        listenerFuture?.cancel(true)
        listnerExecutor.shutdownNow()

        try {
            if (!stream!!.isClosed) stream!!.close()
        } catch (ex: PSQLException) {
            // Postgres always seems to throw this error
            if ("Database connection failed when ending copy" != ex.message) {
                LOG.warn("Error closing stream!", ex)
            }
        } catch (ex: Exception) {
            LOG.warn("Error closing stream!", ex)
        }
        try {
            if (!con!!.isClosed) con!!.close()
        } catch (ex: Exception) {
            LOG.warn("Error closing connection!", ex)
        }
    }

    // -------------------------------------------- helper methods ----------------------------------------------------
    private fun toString(buffer: ByteBuffer): String {
        val offset = buffer.arrayOffset()
        val source = buffer.array()
        val length = source.size - offset
        return String(source, offset, length)
    }

    private fun createReplicationStream(slotName: String, lsn: Long): PGReplicationStream {
        val stream = con!!.replicationAPI
                .replicationStream()
                .logical()
                .withSlotName(slotName)
                .withStartPosition(LogSequenceNumber.valueOf(lsn))
                .withSlotOption("include-xids", true)
                .withSlotOption("include-types", false)
                .withSlotOption("include-timestamp", true)
                .withSlotOption("include-schemas", false)
                .withSlotOption("include-lsn", true)
                //.withStatusInterval(20, TimeUnit.SECONDS)
                .start()
        return stream
    }
}