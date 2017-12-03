package net.squarelabs.pgrepl

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class DbHelperTest {

    val NAME = "pgrepl_test";

    @Test
    fun shouldCrud() {
        try {
            val db = DbHelper("jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres");
            if(db.list().contains(NAME)) db.drop(NAME);
            assertEquals("should not have test db after drop", false, db.list().contains(NAME));
            db.create(NAME)
            assertEquals("should not test db after create", true, db.list().contains(NAME));
        } catch (ex: Exception) {
            assertNull(ex);
        }
    }
}