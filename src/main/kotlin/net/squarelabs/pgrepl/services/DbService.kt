package net.squarelabs.pgrepl.services

import javax.inject.Inject
import javax.inject.Singleton
import javax.persistence.Table

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
            con.prepareStatement(sqlSlots).use { stmt ->
                stmt.setString(1, dbName)
                stmt.executeQuery().use { rs ->
                    val dbNames = mutableListOf<String>()
                    while (rs.next()) {
                        dbNames.add(rs.getString(1))
                    }
                    return dbNames
                }
            }
        }
    }

    fun list(): List<String> {
        conSvc.getConnection(cfgSvc.getJdbcDatabaseUrl()).use { con ->
            con.prepareStatement(sqlList).use { stmt ->
                stmt.executeQuery().use { rs ->
                    val dbNames = mutableListOf<String>()
                    while (rs.next()) {
                        dbNames.add(rs.getString(1))
                    }
                    return dbNames
                }
            }
        }
    }

    fun drop(dbName: String) {
        getSlots(dbName).forEach { s -> slotSvc.drop(s) }
        conSvc.getConnection(cfgSvc.getJdbcDatabaseUrl()).use { con ->
            con.prepareStatement("drop database $dbName;").use { stmt ->
                // TODO: SQL injection
                stmt.execute()
            }
        }
    }

    fun create(dbName: String) {
        conSvc.getConnection(cfgSvc.getJdbcDatabaseUrl()).use { con ->
            con.prepareStatement("create database $dbName;").use { stmt ->
                // TODO: SQL injection
                stmt.execute()
            }
        }
    }

    fun insert(url: String, row: Any) {
        conSvc.getConnection(url).use { con ->
            val clazz = row.javaClass // TODO: Cache for speed
            val ano = clazz.declaredAnnotations.find { ano -> ano is Table } as Table
            val tableName = ano.name
            val keys = row.javaClass.declaredFields
                    .map { field -> field.name }
            val keyClause = keys
                    .map { "\"" + it + "\"" }
                    .joinToString(",")
            val values = keys.map { "?" }.joinToString(",")
            val sql = "insert into \"$tableName\" ($keyClause) values ($values)"
            con.prepareStatement(sql).use { stmt ->
                row.javaClass.declaredFields.forEachIndexed { idx, field ->
                    field.isAccessible = true
                    val value = field.get(row)
                    stmt.setObject(idx + 1, value)
                }
                val affected = stmt.executeUpdate()
                if (affected != 1) throw IllegalStateException("Unable to insert!")
            }
        }
    }

}