package net.squarelabs.pgrepl.services

import net.squarelabs.pgrepl.model.Snapshot
import org.postgresql.core.BaseConnection
import org.postgresql.replication.LogSequenceNumber
import java.sql.Connection

class CrudService {
    private val txnMapSql = "INSERT INTO \"txnIdMap\" (xid, \"clientTxnId\") VALUES (txid_current(),?)"
    private val getTxnSql = "SELECT \"clientTxnId\" FROM \"txnIdMap\" WHERE xid=?"

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

    fun getCurrentLsn(con: BaseConnection): Long {
        con.prepareStatement("SELECT pg_current_xlog_insert_location()").use { stmt ->
            stmt.executeQuery().use { rs ->
                rs.next()
                val lsn = LogSequenceNumber.valueOf(rs.getString(1)).asLong()
                return lsn
            }
        }
    }

    fun updateTxnMap(txnId: String, con: BaseConnection) {
        con.prepareStatement(txnMapSql).use { stmt ->
            stmt.setString(1, txnId)
            val res = stmt.executeUpdate()
            if (res != 1) throw Exception("Unable update txn map!")
        }
    }

    fun getClientTxnId(xid: Long, con: BaseConnection): String {
        con.prepareStatement(getTxnSql).use { stmt ->
            stmt.setLong(1, xid)
            stmt.executeQuery().use { rs ->
                if (!rs.next()) throw Exception("Error reading clientTxnId: $xid!")
                val txnId = rs.getString(1)
                return txnId
            }
        }
    }

}