package net.squarelabs.pgrepl.services

import org.junit.Assert.assertEquals
import org.junit.Test

class DbServiceTest {

    private val name = "pgrepl_test"

    @Test
    fun shouldCrud() {
        println("--- DbServiceTest")
        val conString = "jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres"
        DbService(conString).use {
            if(it.list().contains(name)) it.drop(name)
            assertEquals("should not have test db after drop", false, it.list().contains(name))
            it.create(name)
            assertEquals("should have test db after create", true, it.list().contains(name))
            // throw IllegalStateException("WTF")
        }
    }
}