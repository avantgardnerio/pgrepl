package net.squarelabs.pgrepl.factories

import net.squarelabs.pgrepl.ReplicationSocket
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ReplicationService
import org.junit.Assert
import org.junit.Test

class ReplicationSocketFactoryTest {

    @Test
    fun shouldReturnASocket() {
        val cfgService = ConfigService()
        val replService = ReplicationService(cfgService)
        val factory = ReplicationSocketFactory(replService, cfgService)
        val actual = factory.getEndpointInstance(ReplicationSocket::class.java)
        Assert.assertNotNull("ReplicationSocketFactory should return a socket", actual)
    }
}