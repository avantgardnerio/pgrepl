package net.squarelabs.pgrepl.services

import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DbService @Inject constructor(
        val cfgSvc: ConfigService,
        val conSvc: ConnectionService,
        val slotSvc: SlotService
) {

    private val sqlList = "SELECT datname FROM pg_database WHERE datistemplate = FALSE;"
    private val sqlSlots = "SELECT slot_name FROM pg_replication_slots WHERE database = ?;"

    fun getSlots(dbName: String): List<String> {
        conSvc.getConnection(cfgSvc.getJdbcDatabaseUrl()).use { con ->
            con.prepareStatement(sqlSlots).use {
                it.setString(1, dbName)
                it.executeQuery().use {
                    val dbNames = mutableListOf<String>()
                    while (it.next()) {
                        dbNames.add(it.getString(1))
                    }
                    return dbNames
                }
            }
        }
    }

    fun list(): List<String> {
        conSvc.getConnection(cfgSvc.getJdbcDatabaseUrl()).use { con ->
            con.prepareStatement(sqlList).use {
                it.executeQuery().use {
                    val dbNames = mutableListOf<String>()
                    while (it.next()) {
                        dbNames.add(it.getString(1))
                    }
                    return dbNames
                }
            }
        }
    }

    fun drop(dbName: String) {
        getSlots(dbName).forEach { s -> slotSvc.drop(s) }
        conSvc.getConnection(cfgSvc.getJdbcDatabaseUrl()).use { con ->
            con.prepareStatement("drop database $dbName;").use {
                // TODO: SQL injection
                it.execute()
            }
        }
    }

    fun create(dbName: String) {
        conSvc.getConnection(cfgSvc.getJdbcDatabaseUrl()).use { con ->
            con.prepareStatement("create database $dbName;").use {
                // TODO: SQL injection
                it.execute()
            }
        }
    }

}