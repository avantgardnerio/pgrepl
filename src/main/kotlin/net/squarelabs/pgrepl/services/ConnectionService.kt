package net.squarelabs.pgrepl.services

import com.codahale.metrics.Gauge
import com.codahale.metrics.MetricRegistry.name
import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.db.PoolConnection
import org.eclipse.jetty.util.log.Log
import org.postgresql.core.BaseConnection
import java.sql.DriverManager

@Singleton
class ConnectionService @Inject constructor(
        metricSvc: MetricsService
) {

    companion object {
        private val LOG = Log.getLogger(ConnectionService::class.java)
    }

    private val connections = HashMap<BaseConnection, Exception>()

    init {
        metricSvc.getMetrics().register(name(this.javaClass, "connections", "size"), Gauge<Int> { connections.size })
    }

    // TODO: connection pool
    @Synchronized
    fun getConnection(url: String): BaseConnection {
        val con = PoolConnection(this, DriverManager.getConnection(url) as BaseConnection)
        connections.put(con, Exception())
        return con
    }

    @Synchronized
    fun reset() {
        connections.keys.forEach { it.close() }
        connections.clear()
    }

    @Synchronized
    fun audit() {
        for ((connection, ex) in connections) {
            if (connection.isClosed) continue
            LOG.warn("Connection not closed!", ex)
        }
    }

    @Synchronized
    fun release(con: PoolConnection) {
        connections.remove(con)
    }
}