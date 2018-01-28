package net.squarelabs.pgrepl.services

import com.codahale.metrics.Gauge
import com.codahale.metrics.MetricRegistry.name
import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.db.Replicator
import org.eclipse.jetty.util.log.Log
import java.util.*
import java.util.concurrent.Future


@Singleton
class ReplicationService @Inject constructor(
        private val cfgSvc: ConfigService,
        private val conSvc: ConnectionService,
        private val slotSvc: SlotService,
        private val crudSvc: CrudService,
        private val cnvSvc: ConverterService,
        private val metricSvc: MetricsService
) : AutoCloseable {

    companion object {
        private val LOG = Log.getLogger(ReplicationService::class.java)
    }

    private val replicators = HashMap<String, Replicator>()
    private var closed = false

    init {
        metricSvc.getMetrics().register(name(this.javaClass, "replicators", "size"), Gauge<Int> { replicators.size })
    }

    @Synchronized
    fun listen(dbName: String, lsn: Long): Long {
        if (closed) throw Exception("Can't subscribe while closing!")
        val repl = replicators.getOrPut(dbName, {
            Replicator(dbName, lsn, cfgSvc, slotSvc, conSvc, crudSvc, cnvSvc, metricSvc)
        })
        return repl.headLsn()
    }

    @Synchronized
    fun subscribe(dbName: String, lsn: Long, handler: (String) -> Future<Void>) {
        if (closed) throw Exception("Can't subscribe while closing!")
        val repl = replicators.getOrPut(dbName, {
            Replicator(dbName, lsn, cfgSvc, slotSvc, conSvc, crudSvc, cnvSvc, metricSvc)
        })
        repl.addListener(lsn, handler)
    }

    @Synchronized
    fun unsubscribe(dbName: String, handler: (String) -> Future<Void>) {
        replicators[dbName]!!.removeListener(handler)
    }

    @Synchronized
    override fun close() {
        LOG.info("Shutting down ReplicationService, and ${replicators.size} listeners...")
        closed = true
        replicators.keys.forEach({ k ->
            LOG.info("Shutting down replicator $k")
            val l = replicators[k]
            l!!.close()
        })
    }

}