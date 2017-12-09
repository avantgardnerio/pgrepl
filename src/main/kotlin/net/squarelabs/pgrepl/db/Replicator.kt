package net.squarelabs.pgrepl.db

import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.SlotService
import org.eclipse.jetty.util.log.Log
import org.postgresql.PGProperty
import org.postgresql.core.BaseConnection
import org.postgresql.core.ServerVersion
import org.postgresql.replication.LogSequenceNumber
import org.postgresql.replication.PGReplicationStream
import java.nio.ByteBuffer
import java.sql.DriverManager
import java.sql.SQLException
import java.util.*
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

class Replicator(val dbName: String, val cfgService: ConfigService) : AutoCloseable {

    val plugin = "wal2json"
    val id = UUID.randomUUID().toString().replace('-', '_')
    val listeners = ArrayList<(String) -> Unit>()
    val replCon: BaseConnection
    val queryCon: BaseConnection
    val stream: PGReplicationStream

    init {
        // Connect to DB
        val properties = Properties()
        PGProperty.ASSUME_MIN_SERVER_VERSION.set(properties, "9.4")
        PGProperty.REPLICATION.set(properties, "database")
        PGProperty.PREFER_QUERY_MODE.set(properties, "simple")
        val url = cfgService.getAppDbUrl()
        replCon = DriverManager.getConnection(url, properties) as BaseConnection
        queryCon = DriverManager.getConnection(url) as BaseConnection

        // Create a slot
        val slotName = "slot_${id}"
        val slot = SlotService(url)
        slot.drop(slotName)
        slot.create(slotName, plugin)

        // Start listening
        val lsn = getCurrentLSN(queryCon)
        stream = replCon
                .replicationAPI
                .replicationStream()
                .logical()
                .withSlotName(slotName)
                .withStartPosition(lsn)
                .withSlotOption("include-xids", true)
                //.withSlotOption("skip-empty-xacts", true)
                .withStatusInterval(20, TimeUnit.SECONDS)
                .start()
        executor.scheduleAtFixedRate({ checkMessages() }, 0, 10, TimeUnit.MILLISECONDS)
    }

    fun checkMessages() {
        try {
            var buffer = stream.readPending()
            while (buffer != null) {
                val str = toString(buffer)
                for(listener in listeners) {
                    listener(str)
                }
                //listeners.forEach({ l -> l(str) })
                buffer = stream.readPending()
                stream.setAppliedLSN(stream.lastReceiveLSN)
                stream.setFlushedLSN(stream.lastReceiveLSN)            }
        } catch (ex: Exception) {
            LOG.warn("Error reading from database!", ex)
            close()
        }
    }

    fun addListener(listener: (String) -> Unit) {
        listeners.add { str -> listener(str) }
    }

    @Throws(SQLException::class)
    private fun getCurrentLSN(con: BaseConnection): LogSequenceNumber {
        val tenPlus = con.haveMinimumServerVersion(ServerVersion.v10)
        val func = if (tenPlus) "pg_current_wal_lsn()" else "pg_current_xlog_location()"
        val sql = "SELECT ${func}"
        con.createStatement().use { st ->
            st.executeQuery(sql).use { rs ->
                if (rs.next()) {
                    val lsn = rs.getString(1)
                    return LogSequenceNumber.valueOf(lsn)
                } else {
                    return LogSequenceNumber.INVALID_LSN
                }
            }
        }
    }

    override fun close() {
        executor.shutdown()
        executor.awaitTermination(3, TimeUnit.SECONDS)
        executor.shutdownNow()

        stream.close()
        replCon!!.close()
        queryCon!!.close()
    }

    companion object {
        private val LOG = Log.getLogger(Replicator::class.java)

        // TODO: Guice
        private val executor = Executors.newScheduledThreadPool(1)

        // TODO: Helper method
        private fun toString(buffer: ByteBuffer): String {
            val offset = buffer.arrayOffset()
            val source = buffer.array()
            val length = source.size - offset

            return String(source, offset, length)
        }
    }

}