package net.squarelabs.pgrepl.services

import org.junit.Assert
import org.junit.Test

class SlotServiceTest {

    private val dbName = "pgrepl_test"

    @Test
    fun shouldCrud() {
        println("--- SlotServiceTest")
        val conString = "jdbc:postgresql://localhost:5432/$dbName?user=postgres&password=postgres"
        SlotService(conString).use {
            if(it.list().contains(dbName)) it.drop(dbName)
            Assert.assertEquals("should not have test db after drop", false, it.list().contains(dbName))
            it.create(dbName, "wal2json")
            Assert.assertEquals("should not test db after create", true, it.list().contains(dbName))
        }
    }

}