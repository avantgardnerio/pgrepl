package net.squarelabs.pgrepl.services

import net.squarelabs.pgrepl.db.Replicator
import org.eclipse.jetty.util.log.Log
import javax.inject.Inject

class ReplicationService @Inject constructor(val configService: ConfigService) : AutoCloseable {

    val listeners = HashMap<String, Replicator>()

    fun subscribe(dbName: String, handler: (String) -> Unit) {
        val repl = listeners.getOrPut(dbName, { Replicator(dbName, configService) })
        repl.addListener(handler)
    }

    override fun close() {
        listeners.values.forEach({ l -> l.close() })
    }

    companion object {
        private val LOG = Log.getLogger(ReplicationService::class.java)
    }

}