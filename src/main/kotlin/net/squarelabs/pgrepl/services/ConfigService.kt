package net.squarelabs.pgrepl.services

class ConfigService {
    val JDBC_DATABASE_URL: String = "jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres"

    fun getJdbcDatabaseUrl() : String {
        return System.getenv("JDBC_DATABASE_URL") ?: JDBC_DATABASE_URL
    }

}