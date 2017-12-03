import org.junit.Assert.assertNotEquals
import org.junit.Test

class TestJUnit {
    @Test
    fun sanity() {
        assertNotEquals("Sanity is in the world", true, false);
    }
}


