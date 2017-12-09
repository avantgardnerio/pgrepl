package net.squarelabs.pgrepl.services

import com.google.inject.AbstractModule
import com.google.inject.Guice
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test

class SlotServiceTest {

    companion object {
        val cfgSvc: ConfigService
        val conSvc: ConnectionService

        init {
            val injector = Guice.createInjector(object : AbstractModule() {
                public override fun configure() {
                }
            })
            cfgSvc = injector.getInstance(ConfigService::class.java)
            conSvc = injector.getInstance(ConnectionService::class.java)
        }

        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun setup() {
            val dbName = cfgSvc.getAppDbName()
            val url = cfgSvc.getJdbcDatabaseUrl()
            DbService(url, conSvc).use {
                if (it.list().contains(dbName)) it.drop(dbName)
                it.create(dbName)
            }
        }
    }

    @Test
    fun shouldCrud() {
        val dbName = cfgSvc.getAppDbName()
        val conString = cfgSvc.getAppDbUrl()
        SlotService(conString, conSvc).use {
            if (it.list().contains(dbName)) it.drop(dbName)
            Assert.assertEquals("should not have test db after drop", false, it.list().contains(dbName))
            it.create(dbName, "wal2json")
            Assert.assertEquals("should not test db after create", true, it.list().contains(dbName))
        }
    }

}