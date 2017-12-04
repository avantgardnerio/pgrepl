package net.squarelabs.pgrepl

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DbHelperTest {

    private val name = "pgrepl_test"

    @Test
    fun shouldCrud() {
        try {
            val conString = "jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres"
            DbHelper(conString).use {
                if(it.list().contains(name)) it.drop(name)
                assertEquals("should not have test db after drop", false, it.list().contains(name))
                it.create(name)
                assertEquals("should have test db after create", true, it.list().contains(name))
            }
        } catch (ex: Exception) {
            assertNull(ex)
        }
    }
}