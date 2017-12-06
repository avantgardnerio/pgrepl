package net.squarelabs.pgrepl;

import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.Logger;

import javax.websocket.*;

public class ReplicationSocket extends Endpoint implements MessageHandler.Whole<String> {
    private static final Logger LOG = Log.getLogger(ReplicationSocket.class);
    private Session session;
    private RemoteEndpoint.Async remote;

    @Override
    public void onClose(Session session, CloseReason close) {
        super.onClose(session, close);
        this.session = null;
        this.remote = null;
        LOG.info("WebSocket Close: {} - {}", close.getCloseCode(), close.getReasonPhrase());
    }

    public void onOpen(Session session, EndpointConfig config) {
        this.session = session;
        this.remote = this.session.getAsyncRemote();
        LOG.info("WebSocket Connect: {}", session);
        this.remote.sendText("You are now connected to " + this.getClass().getName());
        // attach echo message handler
        session.addMessageHandler(this);
    }

    @Override
    public void onError(Session session, Throwable cause) {
        super.onError(session, cause);
        LOG.warn("WebSocket Error", cause);
    }

    @Override
    public void onMessage(String message) {
        LOG.info("Echoing back text message [{}]", message);
        if (this.session != null && this.session.isOpen() && this.remote != null) {
            this.remote.sendText(message);
        }
    }
}