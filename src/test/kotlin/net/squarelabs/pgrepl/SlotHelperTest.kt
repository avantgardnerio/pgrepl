package net.squarelabs.pgrepl

import org.junit.Assert
import org.junit.Test

class SlotHelperTest {

    val NAME = "pgrepl_test";

    @Test
    fun shouldCrud() {
        try {
            val conString = "jdbc:postgresql://localhost:5432/$NAME?user=postgres&password=postgres";
            SlotHelper(conString).use {
                if(it.list().contains(NAME)) it.drop(NAME);
                Assert.assertEquals("should not have test db after drop", false, it.list().contains(NAME));
                it.create(NAME, "test_decoding");
                Assert.assertEquals("should not test db after create", true, it.list().contains(NAME));
            }
        } catch (ex: Exception) {
            Assert.assertNull(ex);
        }
    }

}