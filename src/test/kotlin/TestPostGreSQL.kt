import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test
import java.sql.DriverManager

class TestPostGreSQL {
    @Test
    fun sanity() {
        assertNotEquals("Sanity is in the world", true, false);
    }

    @Test
    fun canExecuteQuery() {
        val expected = true;
        val conString = "jdbc:postgresql://localhost:5432/postgres";
        val username = "postgres";
        val password = "postgres";

        DriverManager.getConnection(conString, username, password).use {
            it.prepareStatement("select true as works;").use {
                it.executeQuery().use {
                    val hasRecord = it.next();
                    assertEquals("Should select 1 record", hasRecord, true);
                    val actual = it.getBoolean(1);
                    assertEquals("Should return true", expected, actual);
                }
            }
        }
    }
}


