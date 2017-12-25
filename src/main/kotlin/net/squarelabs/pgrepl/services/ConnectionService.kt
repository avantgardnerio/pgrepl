package net.squarelabs.pgrepl.services

import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.endpoints.ReplicationSocket
import org.eclipse.jetty.util.log.Log
import org.postgresql.core.BaseConnection
import java.sql.DriverManager

@Singleton class ConnectionService @Inject constructor() {

    companion object {
        private val LOG = Log.getLogger(ConnectionService::class.java)
    }

    val connections = HashMap<BaseConnection, Exception>()

    // TODO: connection pool
    @Synchronized
    fun getConnection(url: String): BaseConnection {
        val con = DriverManager.getConnection(url) as BaseConnection
        connections.put(con, Exception())
        return con
    }

    @Synchronized
    fun reset() {
        for (con in connections.keys) {
            con.close()
        }
        connections.clear()
    }

    @Synchronized
    fun audit() {
        for ((connection, ex) in connections) {
            if (connection.isClosed) continue
            LOG.warn("Connection not closed!", ex)
        }
    }
}