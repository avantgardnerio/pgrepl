package net.squarelabs.pgrepl.endpoints

import com.google.gson.Gson
import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.messages.*
import net.squarelabs.pgrepl.model.*
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.ReplicationService
import net.squarelabs.pgrepl.services.SnapshotService
import org.eclipse.jetty.util.log.Log
import org.postgresql.core.BaseConnection
import java.sql.Connection
import java.util.*
import javax.websocket.*

@Singleton
class ReplicationSocket @Inject constructor(
        val replSvc: ReplicationService,
        val cfgSvc: ConfigService,
        val snapSvc: SnapshotService,
        val conSvc: ConnectionService
) : Endpoint(), MessageHandler.Whole<String> {

    companion object {
        private val LOG = Log.getLogger(ReplicationSocket::class.java)
    }

    private var session: Session? = null
    private var remote: RemoteEndpoint.Async? = null
    var clientId: UUID? = null

    val txnMapSql = "INSERT INTO \"txnIdMap\" (xid, \"clientTxnId\") VALUES (txid_current(),?)"
    val getTxnSql = "SELECT \"clientTxnId\" FROM \"txnIdMap\" WHERE xid=?"

    override fun onOpen(session: Session, config: EndpointConfig) {
        try {
            this.session = session
            this.remote = session.asyncRemote
            session.addMessageHandler(this)
            LOG.info("WebSocket Connect: {}", session.id)
        } catch (ex: Exception) {
            LOG.warn("Error opening websocket!", ex) // TODO: Error handling
        }
    }

    fun onTxn(lsn: Long, json: String) {
        val mapper = Gson()
        val walTxn: Transaction = mapper.fromJson(json, Transaction::class.java)
        if (walTxn.change.size <= 0) {
            return // Not sure why this happens
        }

        // TODO: cache!
        val url = cfgSvc.getAppDbUrl()
        conSvc.getConnection(url).use { con ->
            con.prepareStatement(getTxnSql).use { stmt ->
                stmt.setLong(1, walTxn.xid)
                stmt.executeQuery().use { rs ->
                    if (!rs.next()) {
                        // TODO: Does this still happen, now that we excluded zero size changes above?
                        throw Exception("Error reading clientTxnId: ${walTxn.xid}!")
                    }
                    val txnId = rs.getString(1)
                    val msg = TxnMsg(walTxnToClientTxn(lsn, txnId, walTxn))

                    // TODO: ReplicationSockets with null remotes
                    if (remote != null) remote!!.sendText(mapper.toJson(msg))
                }
            }
        }
    }

    fun walTxnToClientTxn(lsn: Long, txnId: String, walTxn: Transaction): ClientTxn {
        val changes = walTxn.change.map { walChangeToClientChange(it) }
        return ClientTxn(txnId, lsn, changes)
    }

    fun walChangeToClientChange(change: Change): ClientChange {
        val record: Map<String, Any> = (0 until maxOf(change.columnnames.size, change.columnvalues.size))
                .associateBy({ change.columnnames[it] }, { change.columnvalues[it] })
        val size = if (change.oldkeys == null) 0 else maxOf(change.oldkeys.keynames.size, change.oldkeys.keyvalues.size)
        val prior: Map<String, Any> = (0 until size)
                .associateBy({ change.oldkeys!!.keynames[it] }, { change.oldkeys!!.keyvalues[it] })
        return ClientChange(change.kind.toUpperCase(), change.table, record, prior)
    }

    override fun onMessage(json: String) {
        try {
            val mapper = Gson()
            val baseMsg = mapper.fromJson(json, Message::class.java)
            val clazz = when (baseMsg.type) {
                "SUBSCRIBE_REQUEST" -> SubscribeRequest::class.java
                "COMMIT" -> CommitMsg::class.java
                "MULTI_COMMIT" -> MultiCommit::class.java
                "PING" -> PingRequest::class.java
                "SNAPSHOT_REQUEST" -> SnapshotRequest::class.java
                else -> throw Exception("Unknown message: ${baseMsg.type}")
            }
            val msg = mapper.fromJson(json, clazz)
            when (msg) {
                is SubscribeRequest -> handleSubscribe(msg, mapper)
                is CommitMsg -> handleTxns(listOf(msg.txn), mapper)
                is MultiCommit -> handleTxns(msg.txns, mapper)
                is PingRequest -> handlePing(mapper)
                is SnapshotRequest -> handleSnapshotReq(mapper)
                else -> throw Exception("Unknown message: ${msg::class}")
            }
        } catch (ex: Exception) {
            LOG.warn("Error handling message!", ex)
            replSvc.unsubscribe(cfgSvc.getAppDbName(), clientId!!)
            session!!.close()
        }
    }

    private fun handlePing(mapper: Gson) {
        remote!!.sendText(mapper.toJson(PongResponse()))
    }

    private fun handleSnapshotReq(mapper: Gson) {
        conSvc.getConnection(cfgSvc.getAppDbUrl()).use { con ->
            val snap = snapSvc.takeSnapshot(con.unwrap(BaseConnection::class.java))
            val response = SnapshotResponse(snap)
            remote!!.sendText(mapper.toJson(response))
        }
    }

    private fun handleSubscribe(req: SubscribeRequest, mapper: Gson) {
        clientId = UUID.fromString(req.clientId)
        conSvc.getConnection(cfgSvc.getAppDbUrl()).use { con ->
            val dbName = cfgSvc.getAppDbName()
            replSvc.subscribe(dbName, clientId!!, req.lsn, { lsn, json -> onTxn(lsn, json) })
            remote!!.sendText(mapper.toJson(SubscribeResponse(null)))
        }
    }

    fun snapshot(): Snapshot {
        conSvc.getConnection(cfgSvc.getAppDbUrl()).use { con ->
            val snap = snapSvc.takeSnapshot(con, false)
            return snap
        }
    }

    private fun handleTxns(txns: List<ClientTxn>, mapper: Gson) {
        val snap = snapshot()
        conSvc.getConnection(cfgSvc.getAppDbUrl()).use { con ->
            con.autoCommit = false
            for (txn in txns) {
                try {
                    txn.changes.forEach({ change ->
                        when (change.type) {
                            "INSERT" -> handleInsert(change, con)
                            "UPDATE" -> handleUpdate(change, con, snap)
                            "DELETE" -> handleDelete(change, con, snap)
                            else -> throw Exception("Unknown change type: ${change.type}")
                        }
                    })
                    con.prepareStatement(txnMapSql).use { stmt ->
                        stmt.setString(1, txn.id)
                        val res = stmt.executeUpdate()
                        if (res != 1) throw Exception("Unable update txn map!")
                    }
                    con.commit()
                } catch (ex: Exception) {
                    con.rollback()
                    val t = ClientTxn(txn.id, 0, ArrayList())
                    remote!!.sendText(mapper.toJson(TxnMsg(t)))
                }
            }
        }
    }

    private fun handleDelete(change: ClientChange, con: BaseConnection, snap: Snapshot) {
        val table = snap.tables.find { t -> t.name == change.table }!!
        val pkCols = table.columns
                .filter { col -> col.pkOrdinal != null }
                .sortedBy { col -> col.pkOrdinal }
        val whereClause = pkCols
                .map { col -> "\"" + col.name + "\"=?" }
                .joinToString(" and ") + " and curTxnId=?"
        val row = change.record
        val sql = "delete from \"${table.name}\" where $whereClause"
        con.prepareStatement(sql).use { stmt ->
            pkCols.forEachIndexed({ idx, col -> stmt.setObject(idx + 1, row[col.name]) })
            stmt.setObject(pkCols.size + 1, row["prvTxnId"])
            val res = stmt.executeUpdate()
            if (res != 1) throw Exception("Unable to play txn on server!")
        }
    }

    private fun handleUpdate(change: ClientChange, con: BaseConnection, snap: Snapshot) {
        val table = snap.tables.find { t -> t.name == change.table }!!
        val pkCols = table.columns
                .filter { col -> col.pkOrdinal != null }
                .sortedBy { col -> col.pkOrdinal }
        val whereClause = pkCols
                .map { col -> "\"" + col.name + "\"=?" }
                .joinToString(" and ") + " and \"curTxnId\"=?"
        val row = change.record
        val updateClause = row.keys
                .map { "\"" + it + "\"=?" }
                .joinToString(",")
        val sql = "update \"${table.name}\" set $updateClause where $whereClause"
        con.prepareStatement(sql).use { stmt ->
            row.values.forEachIndexed({ idx, value -> stmt.setObject(idx + 1, value) })
            pkCols.forEachIndexed({ idx, col -> stmt.setObject(idx + row.values.size + 1, row[col.name]) })
            stmt.setObject(row.values.size + pkCols.size + 1, row["prvTxnId"])
            val res = stmt.executeUpdate()
            if (res != 1) throw Exception("Unable to play txn on server!")
        }
    }

    private fun handleInsert(change: ClientChange, con: Connection) {
        val row = change.record
        val colNames = row.keys
                .map { "\"" + it + "\"" }
                .joinToString(",")
        val values = row.values.map { "?" }.joinToString(",")
        val sql = "insert into \"${change.table}\" ($colNames) values ($values)"
        con.prepareStatement(sql).use { stmt ->
            row.values.forEachIndexed({ i, v -> stmt.setObject(i + 1, v) })
            val res = stmt.executeUpdate()
            if (res != 1) throw Exception("Unable to play txn on server!")
        }
    }

    override fun onError(session: Session?, cause: Throwable?) {
        super.onError(session, cause)
        LOG.warn("WebSocket Error", cause) // TODO: Error handling
        // TODO: Unsubscribe from replSvc
    }

    override fun onClose(session: Session?, close: CloseReason?) {
        super.onClose(session, close)
        this.session = null
        this.remote = null
        LOG.info("WebSocket Close: {} - {}", close!!.closeCode, close.reasonPhrase)
        replSvc.unsubscribe(cfgSvc.getAppDbName(), clientId!!)
    }

}