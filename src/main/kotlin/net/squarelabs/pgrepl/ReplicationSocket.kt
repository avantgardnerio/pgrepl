package net.squarelabs.pgrepl

import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ReplicationService
import org.eclipse.jetty.util.log.Log
import javax.websocket.*

@Singleton
class ReplicationSocket @Inject constructor(
        val replService: ReplicationService,
        val cfgService: ConfigService
) : Endpoint(), MessageHandler.Whole<String> {

    private var session: Session? = null
    private var remote: RemoteEndpoint.Async? = null

    override fun onOpen(session: Session, config: EndpointConfig) {
        try {
            this.session = session
            this.remote = session.asyncRemote
            LOG.info("WebSocket Connect: {}", session)

            session.addMessageHandler(this)
            replService.subscribe(cfgService.getAppDbName(), { json -> onTxn(json) })
        } catch (ex: Exception) {
            LOG.warn("Error opening websocket!", ex)
        }

    }

    fun onTxn(json: String) {
        remote!!.sendText(json)
    }

    override fun onMessage(message: String) {
        LOG.info("Echoing back text message [{}]", message)
        if (session != null && session!!.isOpen && remote != null) {
            remote!!.sendText(message)
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