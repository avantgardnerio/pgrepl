package net.squarelabs.pgrepl

import java.sql.Connection
import java.sql.DriverManager

class DbHelper(private val conString: String) : AutoCloseable {

    private val con: Connection = DriverManager.getConnection(conString)

    private val sqlName = "SELECT current_database();"
    private val sqlList = "SELECT datname FROM pg_database WHERE datistemplate = false;"
    private val sqlSlots = "select slot_name from pg_replication_slots where database = ?;"

    fun getName(): String {
        con.prepareStatement(sqlName).use {
            it.executeQuery().use {
                it.next()
                return it.getString(1)
            }
        }
    }

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
        SlotHelper(conString).use {
            getSlots(name).forEach { s -> it.drop(s) }
        }
        con.prepareStatement("drop database $name;").use {
            it.execute()
        }
    }

    fun create(name: String) {
        con.prepareStatement("create database $name;").use {
            it.execute()
        }
    }

    override fun close() {
        con.close()
    }

}