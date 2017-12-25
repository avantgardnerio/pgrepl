package net.squarelabs.pgrepl.services

import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.db.Replicator
import org.eclipse.jetty.util.log.Log
import java.util.*

@Singleton
class ReplicationService @Inject constructor(
        val cfgSvc: ConfigService,
        val conSvc: ConnectionService,
        val slotSvc: SlotService
) : AutoCloseable {

    val listeners = HashMap<String, Replicator>()
    var closed = false

    @Synchronized
    fun subscribe(dbName: String, clientId: UUID, lsn: Long, handler: (Long, String) -> Unit) {
        // TODO: global audit for subscribe after close
        if (closed) throw Exception("Can't subscribe while closing!")
        val repl = listeners.getOrPut(dbName, { Replicator(dbName, clientId, lsn, cfgSvc, slotSvc, conSvc) })
        repl.addListener(clientId, handler)
    }

    @Synchronized
    fun unsubscribe(dbName: String, clientId: UUID) {
        listeners.get(dbName)!!.removeListener(clientId)
    }

    @Synchronized
    override fun close() {
        LOG.info("Shutting down ReplicationService, and ${listeners.size} listeners...")
        closed = true
        listeners.keys.forEach({ k ->
            LOG.info("Shutting down listener $k")
            val l = listeners[k]
            l!!.close()
        })
    }

    companion object {
        private val LOG = Log.getLogger(ReplicationService::class.java)
    }

}