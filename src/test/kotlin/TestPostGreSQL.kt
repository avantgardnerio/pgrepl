import org.junit.Assert.assertEquals
import org.junit.Assert.fail
import org.junit.BeforeClass
import org.junit.Test
import org.postgresql.util.PSQLException
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

    @Test
    fun canCreateSlot() {
        val conString = "jdbc:postgresql://localhost:5432/test";
        val username = "postgres";
        val password = "postgres";

        DriverManager.getConnection(conString, username, password).use {
            it.prepareStatement("SELECT * FROM pg_create_logical_replication_slot(?, ?)").use {
                it.setString(1, "slot")
                it.setString(2, "test_decoding")
                try {
                    it.executeQuery().use({ rs ->
                        while (rs.next()) {
                            println("Slot Name: " + rs.getString(1))
                            println("Xlog Position: " + rs.getString(2))
                        }
                    })
                } catch (ex: PSQLException) {
                    // if (ex.message!!.contains("already exists")) return
                    fail("Unable to create slot: $ex");
                }
            }
        }
    }

}


