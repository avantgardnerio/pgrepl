import org.junit.Assert.assertEquals
import org.junit.BeforeClass
import org.junit.Test
import java.sql.DriverManager

class TestPostGreSQL {
    companion object {
        @BeforeClass
        @JvmStatic
        fun createDatabase() {
            val conString = "jdbc:postgresql://localhost:5432/postgres";
            val username = "postgres";
            val password = "postgres";

            DriverManager.getConnection(conString, username, password).use {
                it.prepareStatement("drop database if exists test;").use {
                    it.execute()
                }

                it.prepareStatement("create database test;").use {
                    it.execute()
                }
            }

        }
    }

    @Test
    fun canExecuteQuery() {
        val expected = true;
        val conString = "jdbc:postgresql://localhost:5432/test";
        val username = "postgres";
        val password = "postgres";

        DriverManager.getConnection(conString, username, password).use {
            it.prepareStatement("select true as works;").use {
                it.executeQuery().use {
                    val hasRecord = it.next();
                    assertEquals("Should select 1 record", true, hasRecord);
                    val actual = it.getBoolean(1);
                    assertEquals("Should return true", expected, actual);
                }
            }
        }
    }


}


