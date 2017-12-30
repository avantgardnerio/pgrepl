package net.squarelabs.pgrepl.services

import net.squarelabs.pgrepl.model.*
import org.postgresql.core.BaseConnection
import org.postgresql.core.ServerVersion
import org.postgresql.replication.LogSequenceNumber
import java.sql.Connection
import java.sql.SQLException
import kotlin.reflect.KClass

class SnapshotService {

    fun takeSnapshot(con: BaseConnection, includeRows: Boolean = true): Snapshot {
        val getSchema = this.javaClass.getResource("/queries/getSchema.sql").readText()
        val schema: List<SchemaRow> = query(getSchema, SchemaRow::class, con)
        val tableNames = schema
                .map { it.tableName }
                .distinct()
        val tables: List<Table> = tableNames
                .map { tableName ->
                    val columns = schema
                            .filter { it.tableName == tableName }
                            .sortedBy { it.ordinalPosition }
                            .map { Column(it.columnName, it.dataType, it.pkOrdinal) }
                    val colNames = columns.map { it.name }
                    val rows = if(includeRows) selectAll(tableName, colNames, con) else ArrayList()
                    Table(tableName, columns, rows)
                }
        val lsn = getCurrentLSN(con)
        return Snapshot(lsn, tables)
    }

    // TODO: dedupe
    @Throws(SQLException::class)
    private fun getCurrentLSN(con: BaseConnection): Long {
        val tenPlus = con.haveMinimumServerVersion(ServerVersion.v10)
        val func = if (tenPlus) "pg_current_wal_lsn()" else "pg_current_xlog_location()"
        val sql = "SELECT ${func}"
        con.createStatement().use { st ->
            st.executeQuery(sql).use { rs ->
                return if (rs.next()) {
                    val lsn = rs.getString(1)
                    LogSequenceNumber.valueOf(lsn).asLong() + 1L
                } else {
                    LogSequenceNumber.INVALID_LSN.asLong()
                }
            }
        }
    }

    fun selectAll(tableName: String, columns: List<String>, con: Connection): List<Row> {
        val colNames = columns.joinToString(",")
        val sql = "select ${colNames} from ${tableName}"
        val rows = ArrayList<Row>()
        con.createStatement().use { st ->
            st.executeQuery(sql).use {
                while (it.next()) {
                    val args = columns
                            .map { col -> it.getObject(col) }
                            .map { if(it is Int) it.toDouble() else it } // JSON will turn to double anyway
                    val row = Row(args)
                    rows.add(row)
                }
            }
        }
        return rows
    }

    fun <T> query(query: String, clazz: KClass<*>, con: Connection): ArrayList<T> {
        val constructor = clazz.constructors.first()
        val params = constructor.parameters
        val rows = ArrayList<T>()
        con.prepareStatement(query).use { stmt ->
            stmt.executeQuery().use { rs ->
                while (rs.next()) {
                    val args = params.map { param -> rs.getObject(param.name) }
                    val inst: T = constructor.call(*args.toTypedArray()) as T
                    rows.add(inst)
                }
            }
        }
        return rows
    }
}