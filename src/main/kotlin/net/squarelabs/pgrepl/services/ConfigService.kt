package net.squarelabs.pgrepl.services

class ConfigService {
    private val dbHost = "localhost"
    private val dbName = "pgrepl_test"

    fun getDbHost(): String {
        return System.getenv("DB_HOST") ?: dbHost
    }

    fun getJdbcDatabaseUrl(): String {
        return "jdbc:postgresql://${getDbHost()}:5432/postgres?user=postgres&password=postgres"
    }

    fun getAppDbName(): String {
        return dbName
    }

    fun getAppDbUrl(): String {
        return "jdbc:postgresql://${getDbHost()}:5432/$dbName?user=postgres&password=postgres"
    }

}