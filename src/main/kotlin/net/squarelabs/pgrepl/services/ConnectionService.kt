package net.squarelabs.pgrepl.services

import com.google.inject.Inject
import com.google.inject.Singleton
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import java.sql.Connection

@Singleton
class ConnectionService @Inject constructor() {

    val pools = HashMap<String, HikariDataSource>()
    val connections = HashMap<Connection, Exception>() // TODO: evict closed

    @Synchronized
    fun getConnection(url: String): Connection {
        val ds = pools.getOrPut(url, {
            val config = HikariConfig()
            config.leakDetectionThreshold = 3
            config.jdbcUrl = url
            HikariDataSource(config)
        })
        val con = ds.connection
        connections.put(con, Exception())
        return con
    }

    @Synchronized
    fun reset() {
        for (pool in pools.values) {
            pool.close()
        }
        pools.clear()
    }

    @Synchronized
    fun audit() {
        for ((connection, ex) in connections) {
            if (connection.isClosed) continue
            ex.printStackTrace()
        }
    }

}