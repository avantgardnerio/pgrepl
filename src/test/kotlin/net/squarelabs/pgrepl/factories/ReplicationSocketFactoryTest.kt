package net.squarelabs.pgrepl.factories

import com.google.inject.Guice
import net.squarelabs.pgrepl.DefaultInjector
import net.squarelabs.pgrepl.endpoints.ReplicationSocket
import net.squarelabs.pgrepl.services.ReplicationService
import org.junit.Assert
import org.junit.Test

class ReplicationSocketFactoryTest {

    private val injector = Guice.createInjector(DefaultInjector())!!
    private val factory = injector.getInstance(ReplicationSocketFactory::class.java)!!
    private val replSvc = injector.getInstance(ReplicationService::class.java)!!

    @Test
    fun shouldReturnASocket() {
        replSvc.use {
            val actual = factory.getEndpointInstance(ReplicationSocket::class.java)
            Assert.assertNotNull("ReplicationSocketFactory should return a socket", actual)
        }
    }
}