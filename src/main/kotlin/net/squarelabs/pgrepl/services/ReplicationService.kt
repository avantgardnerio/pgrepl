package net.squarelabs.pgrepl.services

import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.db.Replicator
import org.eclipse.jetty.util.log.Log
import java.util.*

@Singleton
class ReplicationService @Inject constructor(
        val configService: ConfigService,
        val conSvc: ConnectionService
) : AutoCloseable {

    val listeners = HashMap<String, Replicator>()

    fun subscribe(dbName: String, clientId: UUID, lsn: Long, handler: (String) -> Unit) {
        val repl = listeners.getOrPut(dbName, { Replicator(dbName, clientId, lsn, configService, conSvc) })
        repl.addListener(handler)
    }

    override fun close() {
        listeners.values.forEach({ l -> l.close() })
    }

    companion object {
        private val LOG = Log.getLogger(ReplicationService::class.java)
    }

}