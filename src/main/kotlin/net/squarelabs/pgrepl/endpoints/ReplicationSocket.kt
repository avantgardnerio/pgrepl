package net.squarelabs.pgrepl.endpoints

import com.google.gson.Gson
import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.messages.*
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.ReplicationService
import net.squarelabs.pgrepl.services.SnapshotService
import org.eclipse.jetty.util.log.Log
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

    override fun onOpen(session: Session, config: EndpointConfig) {
        try {
            this.session = session
            this.remote = session.asyncRemote
            session.addMessageHandler(this)
            LOG.info("WebSocket Connect: {}", session)
        } catch (ex: Exception) {
            LOG.warn("Error opening websocket!", ex) // TODO: Error handling
        }

    }

    fun onTxn(json: String) {
        val mapper = Gson()
        val txn: Transaction = mapper.fromJson(json, Transaction::class.java)
        val msg = TxnMsg(txn)
        remote!!.sendText(mapper.toJson(msg))
    }

    override fun onMessage(json: String) {
        val mapper = Gson()
        val baseMsg = mapper.fromJson(json, Message::class.java)
        val clazz = when (baseMsg.type) {
            "HELLO" -> HelloMsg::class.java
            "COMMIT" -> CommitMsg::class.java
            else -> throw Exception("Unknown message: ${baseMsg.type}")
        }
        val msg = mapper.fromJson(json, clazz)
        when (msg) {
            is HelloMsg -> {
                clientId = UUID.fromString(msg.payload)
                val url = cfgSvc.getAppDbUrl()
                conSvc.getConnection(url).use { con ->
                    val snap = snapSvc.takeSnapshot(con)
                    val msg = SnapMsg(snap)
                    remote!!.sendText(mapper.toJson(msg))
                    val dbName = cfgSvc.getAppDbName()
                    replSvc.subscribe(dbName, clientId!!, snap.lsn, { json -> onTxn(json) })
                }
            }
            is CommitMsg -> {
                msg.txn.changes.forEach({
                    when(it.type) {
                        "INSERT" -> {
                            val row = it.record
                            val url = cfgSvc.getAppDbUrl()
                            conSvc.getConnection(url).use { con ->
                                val colNames = row.keys.joinToString(",")
                                val values = row.values.map { "?" }.joinToString(",")
                                val sql = "insert into ${it.table} (${colNames}) values (${values})"
                                con.prepareStatement(sql).use {
                                    row.values.forEachIndexed( { i, v -> it.setObject(i+1, v)})
                                    val res = it.executeUpdate()
                                    // TODO: commit transaction atomically
                                    // TODO: use txnId and prevTxnId for optimistic concurrency
                                    // TODO: refactor into service
                                    // TODO: create table to hold mappings between client & server TxnIds
                                    println("affected=${res}")
                                }
                            }
                        }
                        else -> throw Exception("Unknown change type${it.type}")
                    }
                })
            }
            else -> throw Exception("Unknown message: ${msg::class}") // TODO: Error handling
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