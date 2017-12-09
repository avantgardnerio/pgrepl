package net.squarelabs.pgrepl.factories

import net.squarelabs.pgrepl.ReplicationSocket
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ReplicationService
import javax.inject.Inject
import javax.websocket.server.ServerEndpointConfig

class ReplicationSocketFactory @Inject constructor(
        val replService: ReplicationService,
        val cfgService: ConfigService
) : ServerEndpointConfig.Configurator() {

    @Throws(InstantiationException::class)
    override fun <T> getEndpointInstance(clazz: Class<T>): T {
        return ReplicationSocket(replService, cfgService) as T
    }
}