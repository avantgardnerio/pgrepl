package net.squarelabs.pgrepl.services

import com.google.inject.Inject
import com.google.inject.Singleton
import org.postgresql.core.BaseConnection
import java.sql.DriverManager

@Singleton class ConnectionService @Inject constructor() {

    val connections = HashMap<BaseConnection, Exception>()

    // TODO: connection pool
    @Synchronized
    fun getConnection(url: String): BaseConnection {
        val con = DriverManager.getConnection(url) as BaseConnection
        connections.put(con, Exception())
        return con
    }

    @Synchronized
    fun audit() {
        for ((connection, ex) in connections) {
            if (connection.isClosed) continue
            ex.printStackTrace()
        }
    }
}