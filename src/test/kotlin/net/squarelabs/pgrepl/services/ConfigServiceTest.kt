package net.squarelabs.pgrepl.services

import org.junit.Assert
import org.junit.Test

class ConfigServiceTest {
    @Test
    fun shouldReturnDefaultUrl() {

        // Setup
        val expected = "jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres"
        val configService = ConfigService()

        // Exercise
        val actual = configService.getJdbcDatabaseUrl()

        // Assert
        Assert.assertEquals("ConfigService should return default UR", expected, actual);
    }
}