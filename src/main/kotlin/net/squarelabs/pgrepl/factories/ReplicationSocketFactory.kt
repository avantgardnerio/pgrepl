package net.squarelabs.pgrepl.factories

import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.endpoints.ReplicationSocket
import net.squarelabs.pgrepl.services.*
import javax.websocket.server.ServerEndpointConfig

@Singleton
class ReplicationSocketFactory @Inject constructor(
        val replService: ReplicationService,
        val cfgService: ConfigService,
        val snapSvc: SnapshotService,
        val conSvc: ConnectionService,
        val crudSvc: CrudService
) : ServerEndpointConfig.Configurator() {

    @Throws(InstantiationException::class)
    override fun <T> getEndpointInstance(clazz: Class<T>): T {
        return ReplicationSocket(replService, cfgService, snapSvc, conSvc, crudSvc) as T
    }
}