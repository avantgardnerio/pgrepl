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
    private val dbSvc = injector.getInstance(DbService::class.java)!!

    @After
    fun tearDown() {
        conSvc.reset()
    }

    @Test
    fun shouldCrud() {
        val name = cfgSvc.getAppDbName()
        if (dbSvc.list().contains(name)) dbSvc.drop(name)
        assertEquals("should not have test db after drop", false, dbSvc.list().contains(name))
        dbSvc.create(name)
        assertEquals("should have test db after create", true, dbSvc.list().contains(name))
    }

}