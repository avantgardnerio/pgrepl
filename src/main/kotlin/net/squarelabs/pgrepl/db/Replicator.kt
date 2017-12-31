package net.squarelabs.pgrepl.db

import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.SlotService
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
import kotlin.collections.HashMap

class Replicator(
        val dbName: String,
        val clientId: UUID,
        val lsn: Long,
        val cfgSvc: ConfigService,
        val slotSvc: SlotService,
        val conSvc: ConnectionService
) : AutoCloseable {

    private val executor = Executors.newScheduledThreadPool(1)
    val plugin = "wal2json"
    val listeners = HashMap<UUID, (Long, String) -> Unit>()
    val con: BaseConnection
    val stream: PGReplicationStream
    val future: Future<*>

    init {
        // Connect to DB
        val properties = Properties()
        PGProperty.ASSUME_MIN_SERVER_VERSION.set(properties, "9.4")
        PGProperty.REPLICATION.set(properties, "database")
        PGProperty.PREFER_QUERY_MODE.set(properties, "simple")
        val url = cfgSvc.getAppDbUrl() // TODO: Listen to dbName, not cfgService.AppDb
        con = DriverManager.getConnection(url, properties) as BaseConnection // TODO: Share connection, cache, don't flush

        // Create a slot
        val slotName = "slot_${clientId.toString().replace("-", "_")}"
        if(!slotSvc.list().contains(slotName)) {
            slotSvc.create(url, slotName, plugin)
            LOG.info("Created slot $slotName")
        } else {
            LOG.info("Reconnected slot $slotName @ LSN=$lsn")
        }

        // Start listening (https://github.com/eulerto/wal2json/blob/master/wal2json.c)
        stream = con
                .replicationAPI
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
        future = executor.scheduleAtFixedRate({ checkMessages() }, 0, 10, TimeUnit.MILLISECONDS)
    }

    fun checkMessages() {
        try {
            // LOG.info("------ read {}", clientId)
            var buffer = stream.readPending()
            while (buffer != null) {
                val lsn = stream.lastReceiveLSN
                val str = toString(buffer)
                synchronized(this, {
                    listeners.values.forEach({ l -> l(lsn.asLong(), str) })
                })
                stream.setAppliedLSN(lsn)
                //stream.setFlushedLSN(lsn) // TODO: never flush?
                buffer = stream.readPending()
            }
        } catch (ex: PSQLException) {
            if("Database connection failed when reading from copy" != ex.message) {
                LOG.warn("Error reading from database for client $clientId", ex)
                close()
            }
        } catch (ex: Exception) {
            LOG.warn("Error reading from database for client $clientId", ex)
            close()
        }
    }

    @Synchronized
    fun addListener(clientId: UUID, listener: (Long, String) -> Unit) {
        listeners.put(clientId, listener)
    }

    @Synchronized
    fun removeListener(clientId: UUID) {
        listeners.remove(clientId)
    }

    override fun close() {
        LOG.info("Closing Replicator $clientId")
        future.cancel(true)
        executor.shutdownNow()

        try {
            if (!stream.isClosed) stream.close()
        } catch (ex: PSQLException) {
            // Postgres always seems to throw this error
            if("Database connection failed when ending copy" != ex.message) {
                LOG.warn("Error closing stream!", ex)
            }
        } catch (ex: Exception) {
            LOG.warn("Error closing stream!", ex)
        }
        try {
            if(!con.isClosed) con.close()
        } catch (ex: Exception) {
            LOG.warn("Error closing connection!", ex)
        }
    }

    companion object {
        private val LOG = Log.getLogger(Replicator::class.java)

        // TODO: Helper method
        private fun toString(buffer: ByteBuffer): String {
            val offset = buffer.arrayOffset()
            val source = buffer.array()
            val length = source.size - offset

            return String(source, offset, length)
        }
    }

}