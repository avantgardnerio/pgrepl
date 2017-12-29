package net.squarelabs.pgrepl.client

import com.fasterxml.jackson.databind.ObjectMapper
import com.google.gson.Gson
import net.squarelabs.pgrepl.messages.Message
import net.squarelabs.pgrepl.messages.SnapshotRequest
import net.squarelabs.pgrepl.messages.SnapshotResponse
import net.squarelabs.pgrepl.messages.TxnMsg
import net.squarelabs.pgrepl.model.Snapshot
import net.squarelabs.pgrepl.model.Transaction
import org.eclipse.jetty.websocket.api.Session
import org.eclipse.jetty.websocket.api.WebSocketListener
import org.eclipse.jetty.websocket.client.ClientUpgradeRequest
import org.eclipse.jetty.websocket.client.WebSocketClient
import java.net.URI
import java.util.*
import kotlin.collections.ArrayList

open class ReplicationClient(uri: URI) : WebSocketListener {

    private val id: UUID = UUID.randomUUID()
    private val mapper: ObjectMapper = ObjectMapper()
    private val log = ArrayList<Transaction>()

    private var session: Session? = null
    private var db: Snapshot? = null

    init {
        val client = WebSocketClient()
        client.start()
        client.connect(this, uri, ClientUpgradeRequest())
    }

    override fun onWebSocketConnect(session: Session?) {
        this.session = session
        val msg = SnapshotRequest()
        val json = mapper.writeValueAsString(msg)
        session!!.remote.sendString(json)
    }

    override fun onWebSocketText(json: String?) {
        val baseMsg: Message = Gson().fromJson(json, Message::class.java)
        val clazz = when (baseMsg.type) {
            "TXN" -> TxnMsg::class.java
            "SNAP" -> SnapshotResponse::class.java
            else -> throw Exception("Unknown type: ${baseMsg.type}")
        }
        val msg = Gson().fromJson(json, clazz)
        when (msg) {
            is TxnMsg -> onTxn(msg.payload)
            is SnapshotResponse -> onSnapshot(msg.payload)
        }
    }

    open fun onSnapshot(snapshot: Snapshot) {
        if (db != null) {
            throw Exception("Database cannot be initialized twice!")
        }
        db = snapshot
    }

    private fun onTxn(txn: Transaction) {
        log.add(txn)
    }

    override fun onWebSocketError(cause: Throwable?) {
        TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
    }

    override fun onWebSocketClose(statusCode: Int, reason: String?) {
        TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
    }

    override fun onWebSocketBinary(payload: ByteArray?, offset: Int, len: Int) {
        TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
    }

}