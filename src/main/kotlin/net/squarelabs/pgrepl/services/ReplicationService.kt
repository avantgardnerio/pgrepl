package net.squarelabs.pgrepl.services

import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.db.Replicator
import org.eclipse.jetty.util.log.Log
import java.util.*
import java.util.concurrent.Future

@Singleton
class ReplicationService @Inject constructor(
        val cfgSvc: ConfigService,
        val conSvc: ConnectionService,
        val slotSvc: SlotService,
        val crudSvc: CrudService,
        val cnvSvc: ConverterService
) : AutoCloseable {

    companion object {
        private val LOG = Log.getLogger(ReplicationService::class.java)
    }

    val replicators = HashMap<String, Replicator>()
    var closed = false

    @Synchronized
    fun subscribe(dbName: String, lsn: Long, handler: (String) -> Future<Void>) {
        if (closed) throw Exception("Can't subscribe while closing!")
        val repl = replicators.getOrPut(dbName, {
            Replicator(dbName, lsn, cfgSvc, slotSvc, conSvc, crudSvc, cnvSvc)
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