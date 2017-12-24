package net.squarelabs.pgrepl.services

import com.google.inject.Guice
import net.squarelabs.pgrepl.DefaultInjector
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Test

class DbServiceTest {

    private val injector = Guice.createInjector(DefaultInjector())!!
    private val cfgSvc = injector.getInstance(ConfigService::class.java)!!
    private val conSvc = injector.getInstance(ConnectionService::class.java)!!

    @After
    fun tearDown() {
        conSvc.reset()
    }

    @Test
    fun shouldCrud() {
        val name = cfgSvc.getAppDbName()
        val conString = cfgSvc.getJdbcDatabaseUrl()
        DbService(conString, conSvc).use {
            if (it.list().contains(name)) it.drop(name)
            assertEquals("should not have test db after drop", false, it.list().contains(name))
            it.create(name)
            assertEquals("should have test db after create", true, it.list().contains(name))
        }
    }
}