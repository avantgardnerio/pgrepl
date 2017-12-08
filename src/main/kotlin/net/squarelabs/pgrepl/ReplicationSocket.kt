package net.squarelabs.pgrepl

import org.eclipse.jetty.util.log.Log
import org.postgresql.PGProperty
import org.postgresql.core.BaseConnection
import org.postgresql.core.ServerVersion
import org.postgresql.replication.LogSequenceNumber
import java.nio.ByteBuffer
import java.sql.DriverManager
import java.sql.SQLException
import java.util.*
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.websocket.*

class ReplicationSocket : Endpoint(), MessageHandler.Whole<String> {
    private var session: Session? = null
    private var remote: RemoteEndpoint.Async? = null

    override fun onClose(session: Session?, close: CloseReason?) {
        super.onClose(session, close)
        this.session = null
        this.remote = null
        // TODO: Clear scheduled task
        LOG.info("WebSocket Close: {} - {}", close!!.closeCode, close.reasonPhrase)
    }

    override fun onOpen(session: Session, config: EndpointConfig) {
        try {
            this.session = session
            this.remote = this.session!!.asyncRemote
            LOG.info("WebSocket Connect: {}", session)
            this.remote!!.sendText("You are now connected to " + this.javaClass.name)
            // attach echo message handler
            session.addMessageHandler(this)

            // TODO: Can't use one slot per client
            val properties = Properties()
            properties.setProperty("user", "postgres")
            properties.setProperty("password", "postgres")
            PGProperty.ASSUME_MIN_SERVER_VERSION.set(properties, "9.4")
            PGProperty.REPLICATION.set(properties, "database")
            PGProperty.PREFER_QUERY_MODE.set(properties, "simple")
            val url = "jdbc:postgresql://localhost/pgrepl_test"
            val replCon = DriverManager.getConnection(url, properties) as BaseConnection

            // TODO: connection pool
            val queryCon = DriverManager.getConnection(url, "postgres", "postgres") as BaseConnection

            val slotName = "slot" + session.id

            val conString = "jdbc:postgresql://localhost:5432/pgrepl_test?user=postgres&password=postgres"
            val slot = SlotHelper(conString)
            slot.drop(slotName)
            slot.create(slotName, "wal2json")

            // TODO: implement AutoClosable and stop the timer and close the connection
            val lsn = getCurrentLSN(queryCon)
            val stream = replCon
                    .replicationAPI
                    .replicationStream()
                    .logical()
                    .withSlotName(slotName)
                    .withStartPosition(lsn)
                    .withSlotOption("include-xids", true)
                    //.withSlotOption("skip-empty-xacts", true)
                    .withStatusInterval(20, TimeUnit.SECONDS)
                    .start()
            // TODO: read as fast as possible, not every 10ms
            val task = {
                try {
                    val buffer = stream.readPending()
                    if (buffer != null) {
                        val str = toString(buffer)
                        println(str)
                        remote!!.sendText(str)

                        // TODO: Only clear on confirm from client
                        stream.setAppliedLSN(stream.lastReceiveLSN)
                        stream.setFlushedLSN(stream.lastReceiveLSN)
                    }
                } catch (ex: Exception) {
                    // TODO: Kill timer
                    // TODO: slf4jsimple
                    println(ex.toString())
                }
            }
            executor.scheduleAtFixedRate(task, 0, 10, TimeUnit.MILLISECONDS)
        } catch (ex: Exception) {
            // TODO: slf4jsimple
            // TODO: error handling
            println(ex.toString())
        }

    }

    // TODO: Refactor
    @Throws(SQLException::class)
    private fun getCurrentLSN(con: BaseConnection): LogSequenceNumber {
        // TODO: pg_current_wal_lsn() after 10+
        val tenPlus = con.haveMinimumServerVersion(ServerVersion.v10)
        // TODO: kotlin string interpolation
        val `fun` = if (tenPlus) "pg_current_wal_lsn()" else "pg_current_xlog_location()"
        val sql = "SELECT " + `fun`
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


    override fun onError(session: Session?, cause: Throwable?) {
        super.onError(session, cause)
        LOG.warn("WebSocket Error", cause)
    }

    override fun onMessage(message: String) {
        LOG.info("Echoing back text message [{}]", message)
        if (this.session != null && this.session!!.isOpen && this.remote != null) {
            this.remote!!.sendText(message)
        }
    }

    companion object {
        private val LOG = Log.getLogger(ReplicationSocket::class.java)

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