package net.squarelabs.pgrepl

import java.sql.Connection
import java.sql.DriverManager

class DbHelper(private val conString: String) : AutoCloseable {

    private val con: Connection = DriverManager.getConnection(conString);

    private val SQL_NAME = "SELECT current_database();";
    private val SQL_LIST = "SELECT datname FROM pg_database WHERE datistemplate = false;";
    val SQL_SLOTS = "select slot_name from pg_replication_slots where database = ?;";

    fun getName(): String {
        con.prepareStatement(SQL_NAME).use {
            it.executeQuery().use {
                val dbNames = mutableListOf<String>();
                it.next();
                return it.getString(1);
            }
        }
    }

    fun getSlots(): List<String> {
        val name = getName();
        con.prepareStatement(SQL_SLOTS).use {
            it.setString(1, name)
            it.executeQuery().use {
                val dbNames = mutableListOf<String>();
                while (it.next()) {
                    dbNames.add(it.getString(1));
                }
                return dbNames;
            }
        }
    }

    fun list(): List<String> {
        con.prepareStatement(SQL_LIST).use {
            it.executeQuery().use {
                val dbNames = mutableListOf<String>();
                while (it.next()) {
                    dbNames.add(it.getString(1));
                }
                return dbNames;
            }
        }
    }

    fun drop(name: String) {
        SlotHelper(conString).use {
            getSlots().forEach { s -> it.drop(s) }
        }
        con.prepareStatement("drop database $name;").use {
            it.execute();
        }
    }

    fun create(name: String) {
        con.prepareStatement("create database $name;").use {
            it.execute();
        }
    }

    override fun close() {
        con.close();
    }

}