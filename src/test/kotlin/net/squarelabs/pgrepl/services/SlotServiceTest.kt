package net.squarelabs.pgrepl.services

import org.junit.Assert
import org.junit.BeforeClass
import org.junit.Test

class SlotServiceTest {
    
    companion object {
        @BeforeClass
        @JvmStatic
        @Throws(Exception::class)
        fun setup() {
            val dbName = ConfigService().getAppDbName()
            val url = ConfigService().getJdbcDatabaseUrl()
            val db = DbService(url)
            if(db.list().contains(dbName)) db.drop(dbName)
            db.create(dbName)
        }
    }

    @Test
    fun shouldCrud() {
        println("--- SlotServiceTest")
        val dbName = ConfigService().getAppDbName()
        val conString = ConfigService().getAppDbUrl()
        SlotService(conString).use {
            if(it.list().contains(dbName)) it.drop(dbName)
            Assert.assertEquals("should not have test db after drop", false, it.list().contains(dbName))
            it.create(dbName, "wal2json")
            Assert.assertEquals("should not test db after create", true, it.list().contains(dbName))
        }
    }

}