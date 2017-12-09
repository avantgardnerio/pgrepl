package net.squarelabs.pgrepl.client

import org.eclipse.jetty.websocket.api.Session
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage

class ReplClient {
    var session: Session? = null

    @OnWebSocketConnect
    fun onConnect(session: Session) {
        this.session = session
    }

    @OnWebSocketMessage
    fun onMessage(msg: String) {
        //actual = msg
    }
}