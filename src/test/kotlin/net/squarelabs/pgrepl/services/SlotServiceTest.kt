package net.squarelabs.pgrepl.services

import com.google.inject.Guice
import net.squarelabs.pgrepl.DefaultInjector
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test

class SlotServiceTest {

    private val injector = Guice.createInjector(DefaultInjector())!!
    private val cfgSvc = injector.getInstance(ConfigService::class.java)!!
    private val conSvc = injector.getInstance(ConnectionService::class.java)!!
    private val dbSvc = injector.getInstance(DbService::class.java)!!
    private val slotSvc = injector.getInstance(SlotService::class.java)!!

    @Before
    @Throws(Exception::class)
    fun setup() {
        val dbName = cfgSvc.getAppDbName()
        if (dbSvc.list().contains(dbName)) dbSvc.drop(dbName)
        dbSvc.create(dbName)
    }

    @After
    fun tearDown() {
        conSvc.reset()
    }

    @Test
    fun shouldCrud() {
        val dbName = cfgSvc.getAppDbName()
        if (slotSvc.list().contains(dbName)) slotSvc.drop(dbName)
        Assert.assertEquals(
                "should not have test db after drop",
                false, slotSvc.list().contains(dbName)
        )
        slotSvc.create(cfgSvc.getAppDbUrl(), dbName, "wal2json")
        Assert.assertEquals(
                "should not test db after create",
                true, slotSvc.list().contains(dbName)
        )
    }

}