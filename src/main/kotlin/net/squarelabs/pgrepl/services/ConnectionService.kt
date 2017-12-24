package net.squarelabs.pgrepl.services

import com.google.inject.Inject
import com.google.inject.Singleton
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import java.sql.Connection

@Singleton
class ConnectionService @Inject constructor() {

    val pools = HashMap<String, HikariDataSource>()

    @Synchronized
    fun getConnection(url: String): Connection {
        val ds = pools.getOrPut(url, {
            val config = HikariConfig()
            config.jdbcUrl = url
            HikariDataSource(config)
        })
        return ds.connection
    }

    @Synchronized
    fun reset() {
        for (pool in pools.values) {
            pool.close()
        }
        pools.clear()
    }

}