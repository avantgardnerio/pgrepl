package net.squarelabs.pgrepl.endpoints

import com.fasterxml.jackson.databind.ObjectMapper
import com.google.gson.Gson
import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.messages.SnapMsg
import net.squarelabs.pgrepl.messages.TxnMsg
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.ReplicationService
import net.squarelabs.pgrepl.services.SnapshotService
import org.eclipse.jetty.util.log.Log
import javax.websocket.*

@Singleton
class ReplicationSocket @Inject constructor(
        val replSvc: ReplicationService,
        val cfgSvc: ConfigService,
        val snapSvc: SnapshotService,
        val conSvc: ConnectionService
) : Endpoint(), MessageHandler.Whole<String> {

    private val mapper = ObjectMapper()
    private var session: Session? = null
    private var remote: RemoteEndpoint.Async? = null

    override fun onOpen(session: Session, config: EndpointConfig) {
        try {
            this.session = session
            this.remote = session.asyncRemote
            replSvc.subscribe(cfgSvc.getAppDbName(), { json -> onTxn(json) })
            session.addMessageHandler(this)
            val url = cfgSvc.getAppDbUrl()
            conSvc.getConnection(url).use { con ->
                val snap = snapSvc.takeSnapshot(con)
                val msg = SnapMsg(snap)
                remote!!.sendText(mapper.writeValueAsString(msg))
            }
            LOG.info("WebSocket Connect: {}", session)
        } catch (ex: Exception) {
            LOG.warn("Error opening websocket!", ex)
        }

    }

    fun onTxn(json: String) {
        val txn: Transaction = Gson().fromJson(json, Transaction::class.java)
        val msg = TxnMsg(txn)
        remote!!.sendText(mapper.writeValueAsString(msg))
    }

    override fun onMessage(message: String) {
        if (session != null && session!!.isOpen && remote != null) {
            //remote!!.sendText(msgTxt)
        }
    }

    override fun onError(session: Session?, cause: Throwable?) {
        super.onError(session, cause)
        LOG.warn("WebSocket Error", cause)
    }

    override fun onClose(session: Session?, close: CloseReason?) {
        super.onClose(session, close)
        this.session = null
        this.remote = null
        LOG.info("WebSocket Close: {} - {}", close!!.closeCode, close.reasonPhrase)
    }

    companion object {
        private val LOG = Log.getLogger(ReplicationSocket::class.java)
    }
}