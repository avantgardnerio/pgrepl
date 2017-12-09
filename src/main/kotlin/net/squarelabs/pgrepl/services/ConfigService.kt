package net.squarelabs.pgrepl.services

class ConfigService {
    private val jdbcDbUrl: String = "jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres"
    private val dbName = "pgrepl_test"

    fun getJdbcDatabaseUrl() : String {
        return System.getenv("JDBC_DATABASE_URL") ?: jdbcDbUrl
    }

    fun getAppDbName() : String {
        return dbName
    }

    fun getAppDbUrl() : String {
        return "jdbc:postgresql://localhost:5432/$dbName?user=postgres&password=postgres"
    }

}