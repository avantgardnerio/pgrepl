package net.squarelabs.pgrepl.services

import com.google.inject.AbstractModule
import com.google.inject.Guice
import net.squarelabs.pgrepl.db.ReplicatorTest
import org.junit.Assert.assertEquals
import org.junit.Test

class DbServiceTest {

    @Test
    fun shouldCrud() {
        val injector = Guice.createInjector(object : AbstractModule() {
            public override fun configure() {
            }
        })
        val cfgSvc = injector.getInstance(ConfigService::class.java)
        val conSvc = injector.getInstance(ConnectionService::class.java)

        val name = cfgSvc.getAppDbName()
        val conString = cfgSvc.getJdbcDatabaseUrl()
        DbService(conString, conSvc).use {
            if (it.list().contains(name)) it.drop(name)
            assertEquals("should not have test db after drop", false, it.list().contains(name))
            it.create(name)
            assertEquals("should have test db after create", true, it.list().contains(name))
            // throw IllegalStateException("WTF")
        }
    }
}