package net.squarelabs.pgrepl.factories

import com.google.inject.AbstractModule
import com.google.inject.Guice
import net.squarelabs.pgrepl.ReplicationSocket
import net.squarelabs.pgrepl.services.ReplicationService
import org.junit.Assert
import org.junit.Test

class ReplicationSocketFactoryTest {

    @Test
    fun shouldReturnASocket() {
        val injector = Guice.createInjector(object : AbstractModule() {
            public override fun configure() {
            }
        })
        val factory = injector.getInstance(ReplicationSocketFactory::class.java)
        injector.getInstance(ReplicationService::class.java).use {
            val actual = factory.getEndpointInstance(ReplicationSocket::class.java)
            Assert.assertNotNull("ReplicationSocketFactory should return a socket", actual)
        }
    }
}