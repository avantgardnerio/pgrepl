package net.squarelabs.pgrepl.services

import net.squarelabs.pgrepl.model.Snapshot
import org.postgresql.core.BaseConnection
import java.sql.Connection

class CrudService {
    // TODO: Prevent SQL injection (tableName)
    fun insertRow(tableName: String, row: Map<String, Any>, con: Connection) {
        val colNames = row.keys.map { colName -> "\"$colName\"" }.joinToString(",")
        val values = row.values.map { "?" }.joinToString(",")
        val sql = "insert into \"$tableName\" ($colNames) values ($values)"
        con.prepareStatement(sql).use { stmt ->
            row.values.forEachIndexed({ idx, value -> stmt.setObject(idx + 1, value) })
            val res = stmt.executeUpdate()
            if (res != 1) throw IllegalArgumentException("Optimistic concurrency error inserting record!")
        }
    }

    // TODO: Prevent SQL injection (tableName)
    fun updateRow(tableName: String, row: Map<String, Any>, con: BaseConnection, snap: Snapshot) {
        val table = snap.tables.find { t -> t.name == tableName }!!
        val pkCols = table.columns.filter { it.pkOrdinal != null }.sortedBy { it.pkOrdinal }
        val whereClause = pkCols.map { "\"${it.name}\"=?" }.joinToString(" and ") + " and \"curTxnId\"=?"
        val updateClause = row.keys.map { "\"$it\"=?" }.joinToString(",")
        val sql = "update \"$tableName\" set $updateClause where $whereClause"
        con.prepareStatement(sql).use { stmt ->
            row.values.forEachIndexed({ idx, value -> stmt.setObject(idx + 1, value) })
            pkCols.forEachIndexed({ idx, col -> stmt.setObject(idx + row.values.size + 1, row[col.name]) })
            stmt.setObject(row.values.size + pkCols.size + 1, row["prvTxnId"])
            val res = stmt.executeUpdate()
            if (res != 1) throw IllegalArgumentException("Optimistic concurrency error updating record!")
        }
    }

    // TODO: Prevent SQL injection (tableName)
    fun deleteRow(tableName: String, row: Map<String, Any>, con: BaseConnection, snap: Snapshot) {
        val table = snap.tables.find { it.name == tableName }!!
        val pkCols = table.columns.filter { it.pkOrdinal != null }.sortedBy { it.pkOrdinal }
        val whereClause = pkCols.map { "\"${it.name}\"=?" }.joinToString(" and ") + " and \"curTxnId\"=?"
        val sql = "delete from \"${table.name}\" where $whereClause"
        con.prepareStatement(sql).use { stmt ->
            pkCols.forEachIndexed({ idx, col -> stmt.setObject(idx + 1, row[col.name]) })
            stmt.setObject(pkCols.size + 1, row["prvTxnId"])
            val res = stmt.executeUpdate()
            if (res != 1) throw IllegalArgumentException("Optimistic concurrency error deleting record!")
        }
    }

}