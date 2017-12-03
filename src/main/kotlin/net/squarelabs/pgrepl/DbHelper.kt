package net.squarelabs.pgrepl

import java.sql.Connection
import java.sql.DriverManager

class DbHelper(conString: String) : AutoCloseable {

    private val con: Connection = DriverManager.getConnection(conString);

    private val SQL_LIST = "SELECT datname FROM pg_database WHERE datistemplate = false;";

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