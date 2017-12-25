package net.squarelabs.pgrepl.endpoints

import com.google.gson.Gson
import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.messages.*
import net.squarelabs.pgrepl.model.ClientChange
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.ReplicationService
import net.squarelabs.pgrepl.services.SnapshotService
import org.eclipse.jetty.util.log.Log
import org.postgresql.core.BaseConnection
import java.util.*
import javax.websocket.*

@Singleton
class ReplicationSocket @Inject constructor(
        val replSvc: ReplicationService,
        val cfgSvc: ConfigService,
        val snapSvc: SnapshotService,
        val conSvc: ConnectionService
) : Endpoint(), MessageHandler.Whole<String> {

    private var session: Session? = null
    private var remote: RemoteEndpoint.Async? = null
    var clientId: UUID? = null

    val txnMapSql = "INSERT INTO txn_id_map (xid, client_txn_id) VALUES (txid_current(),?)"
    val getTxnSql = "SELECT client_txn_id FROM txn_id_map WHERE xid=?"

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
        val txn: Transaction = mapper.fromJson(json, Transaction::class.java)

        // TODO: connection pool and cache!
        val url = cfgSvc.getAppDbUrl()
        conSvc.getConnection(url).use { con ->
            con.prepareStatement(getTxnSql).use { stmt ->
                stmt.setLong(1, txn.xid)
                stmt.executeQuery().use { rs ->
                    if (!rs.next()) throw Exception("Error reading client_txn_id!")
                    val txnId = rs.getString(1)
                    val msg = TxnMsg(txn.copy(lsn = lsn, clientTxnId = txnId))
                    remote!!.sendText(mapper.toJson(msg))
                }
            }
        }
    }

    override fun onMessage(json: String) {
        try {
            val mapper = Gson()
            val baseMsg = mapper.fromJson(json, Message::class.java)
            val clazz = when (baseMsg.type) {
                "HELLO" -> HelloMsg::class.java
                "COMMIT" -> CommitMsg::class.java
                else -> throw Exception("Unknown message: ${baseMsg.type}")
            }
            val msg = mapper.fromJson(json, clazz)
            when (msg) {
                is HelloMsg -> handleHello(msg, mapper)
                is CommitMsg -> handleMsg(msg)
                else -> throw Exception("Unknown message: ${msg::class}") 
            }
        } catch (ex: Exception) {
            LOG.warn("Error handling message!", ex) // TODO: Close the socket with error status
        }
    }

    private fun handleHello(msg: HelloMsg, mapper: Gson) {
        clientId = UUID.fromString(msg.payload)
        conSvc.getConnection(cfgSvc.getAppDbUrl()).use { con ->
            val snap = snapSvc.takeSnapshot(con.unwrap(BaseConnection::class.java))
            val response = SnapMsg(snap)
            remote!!.sendText(mapper.toJson(response))
            val dbName = cfgSvc.getAppDbName()
            replSvc.subscribe(dbName, clientId!!, snap.lsn, { lsn, json -> onTxn(lsn, json) })
        }
    }

    private fun handleMsg(msg: CommitMsg) {
        msg.txn.changes.forEach({ change ->
            when (change.type) {
                "INSERT" -> handleInsert(change, msg)
                else -> throw Exception("Unknown change type: ${change.type}")
            }
        })
    }

    private fun handleInsert(change: ClientChange, msg: CommitMsg) {
        val row = change.record
        val url = cfgSvc.getAppDbUrl()
        conSvc.getConnection(url).use { con ->
            con.autoCommit = false
            val colNames = row.keys.joinToString(",")
            val values = row.values.map { "?" }.joinToString(",")
            val sql = "insert into ${change.table} ($colNames) values ($values)"
            con.prepareStatement(sql).use {
                row.values.forEachIndexed({ i, v -> it.setObject(i + 1, v) })
                val res = it.executeUpdate()
                // TODO: use txnId and prevTxnId for optimistic concurrency
                // TODO: refactor into service
                if (res != 1) throw Exception("Unable to play txn on server!")
            }
            con.prepareStatement(txnMapSql).use {
                it.setString(1, msg.txn.id)
                val res = it.executeUpdate()
                if (res != 1) throw Exception("Unable update txn map!")
            }
            // TODO: Handle transaction failures
            con.commit()
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
        // TODO: Unsubscribe from replSvc
    }

    companion object {
        private val LOG = Log.getLogger(ReplicationSocket::class.java)
    }
}