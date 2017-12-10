package net.squarelabs.pgrepl.services

import com.google.inject.Guice
import net.squarelabs.pgrepl.DefaultInjector
import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test

class SlotServiceTest {

    companion object {
        private val injector = Guice.createInjector(DefaultInjector())!!
        val cfgSvc = injector.getInstance(ConfigService::class.java)!!
        val conSvc = injector.getInstance(ConnectionService::class.java)!!

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