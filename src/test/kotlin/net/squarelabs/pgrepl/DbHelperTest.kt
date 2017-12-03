package net.squarelabs.pgrepl

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DbHelperTest {

    val NAME = "pgrepl_test";

    @Test
    fun shouldCrud() {
        try {
            val conString = "jdbc:postgresql://localhost:5432/$NAME?user=postgres&password=postgres";
            DbHelper(conString).use {
                if(it.list().contains(NAME)) it.drop(NAME);
                assertEquals("should not have test db after drop", false, it.list().contains(NAME));
                it.create(NAME)
                assertEquals("should have test db after create", true, it.list().contains(NAME));
            }
        } catch (ex: Exception) {
            assertNull(ex);
        }
    }
}