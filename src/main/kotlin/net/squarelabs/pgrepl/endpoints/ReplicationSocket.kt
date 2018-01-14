package net.squarelabs.pgrepl.endpoints

import com.google.gson.Gson
import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.messages.*
import net.squarelabs.pgrepl.model.*
import net.squarelabs.pgrepl.services.*
import org.eclipse.jetty.util.log.Log
import org.postgresql.core.BaseConnection
import java.util.*
import javax.websocket.*

@Singleton
class ReplicationSocket @Inject constructor(
        val replSvc: ReplicationService,
        val cfgSvc: ConfigService,
        val snapSvc: SnapshotService,
        val conSvc: ConnectionService,
        val crudSvc: CrudService
) : Endpoint(), MessageHandler.Whole<String> {

    companion object {
        private val LOG = Log.getLogger(ReplicationSocket::class.java)
    }

    private var session: Session? = null
    private var remote: RemoteEndpoint.Async? = null
    var clientId: UUID? = null

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

    fun handlePgTxn(lsn: Long, json: String) {
        val mapper = Gson()
        val walTxn: Transaction = mapper.fromJson(json, Transaction::class.java)
        if (walTxn.change.size <= 0) return // Not sure why this happens
        conSvc.getConnection(cfgSvc.getAppDbUrl()).use { con ->
            val txnId = crudSvc.getClientTxnId(walTxn.xid, con)
            val msg = TxnMsg(walTxnToClientTxn(lsn, txnId, walTxn))
            if (remote != null) remote!!.sendText(mapper.toJson(msg))
        }
    }

    fun walTxnToClientTxn(lsn: Long, txnId: String, walTxn: Transaction): ClientTxn {
        val changes = walTxn.change.map { walChangeToClientChange(it) }
        return ClientTxn(txnId, lsn, changes)
    }

    fun walChangeToClientChange(change: Change): ClientChange {
        when (change.kind) {
            "delete" -> {
                val size = maxOf(change.oldkeys!!.keynames.size, change.oldkeys.keyvalues.size)
                val prior: Map<String, Any> = (0 until size)
                        .associateBy({ change.oldkeys.keynames[it] }, { change.oldkeys.keyvalues[it] })
                return ClientChange(change.kind.toUpperCase(), change.table, prior, null)
            }
            "update" -> {
                val record: Map<String, Any> = (0 until maxOf(change.columnnames.size, change.columnvalues.size))
                        .associateBy({ change.columnnames[it] }, { change.columnvalues[it] })
                val size = maxOf(change.oldkeys!!.keynames.size, change.oldkeys.keyvalues.size)
                val prior: Map<String, Any> = (0 until size)
                        .associateBy({ change.oldkeys.keynames[it] }, { change.oldkeys.keyvalues[it] })
                return ClientChange(change.kind.toUpperCase(), change.table, record, prior)
            }
            "insert" -> {
                val record: Map<String, Any> = (0 until maxOf(change.columnnames.size, change.columnvalues.size))
                        .associateBy({ change.columnnames[it] }, { change.columnvalues[it] })
                return ClientChange(change.kind.toUpperCase(), change.table, record, null)
            }
        }
        throw IllegalArgumentException("Unknown change type: ${change.kind}")
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
        val dbName = cfgSvc.getAppDbName()
        replSvc.subscribe(dbName, clientId!!, req.lsn, { lsn, json -> handlePgTxn(lsn, json) })
        remote!!.sendText(mapper.toJson(SubscribeResponse(null)))
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
                    handleTxn(txn, con, snap)
                    con.commit()
                } catch (ex: Exception) {
                    con.rollback()
                    val failMsg = ClientTxn(txn.id, 0, ArrayList())
                    remote!!.sendText(mapper.toJson(TxnMsg(failMsg)))
                }
            }
        }
    }

    private fun handleTxn(txn: ClientTxn, con: BaseConnection, snap: Snapshot) {
        txn.changes.forEach({ change ->
            when (change.type) {
                "INSERT" -> crudSvc.insertRow(change.table, change.record, con)
                "UPDATE" -> crudSvc.updateRow(change.table, change.record, con, snap)
                "DELETE" -> crudSvc.deleteRow(change.table, change.record, con, snap)
                else -> throw Exception("Unknown change type: ${change.type}")
            }
        })
        crudSvc.updateTxnMap(txn.id, con)
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