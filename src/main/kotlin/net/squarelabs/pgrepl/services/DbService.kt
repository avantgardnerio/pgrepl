package net.squarelabs.pgrepl.services

import java.sql.Connection

// TODO: Make real service
class DbService(
        private val conString: String,
        val conSvc: ConnectionService
) : AutoCloseable {

    private val con: Connection = conSvc.getConnection(conString)

    private val sqlName = "SELECT current_database();"
    private val sqlList = "SELECT datname FROM pg_database WHERE datistemplate = FALSE;"
    private val sqlSlots = "SELECT slot_name FROM pg_replication_slots WHERE database = ?;"

    fun getSlots(name: String): List<String> {
        con.prepareStatement(sqlSlots).use {
            it.setString(1, name)
            it.executeQuery().use {
                val dbNames = mutableListOf<String>()
                while (it.next()) {
                    dbNames.add(it.getString(1))
                }
                return dbNames
            }
        }
    }

    fun list(): List<String> {
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

    fun drop(name: String) {
        SlotService(conString, conSvc).use {
            getSlots(name).forEach { s -> it.drop(s) }
        }
        con.prepareStatement("drop database $name;").use {
            // TODO: SQL injection
            it.execute()
        }
    }

    fun create(name: String) {
        con.prepareStatement("create database $name;").use {
            // TODO: SQL injection
            it.execute()
        }
    }

    override fun close() {
        con.close()
    }

}