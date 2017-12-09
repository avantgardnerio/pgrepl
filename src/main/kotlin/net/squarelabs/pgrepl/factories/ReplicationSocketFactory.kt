package net.squarelabs.pgrepl.factories

import net.squarelabs.pgrepl.ReplicationSocket
import net.squarelabs.pgrepl.services.ConfigService
import javax.inject.Inject
import javax.websocket.server.ServerEndpointConfig

class ReplicationSocketFactory @Inject constructor(val configService: ConfigService)
    : ServerEndpointConfig.Configurator() {

    @Throws(InstantiationException::class)
    override fun <T> getEndpointInstance(clazz: Class<T>): T {
        return ReplicationSocket(configService) as T
    }
}