package net.squarelabs.pgrepl

import com.google.gson.Gson
import com.google.inject.AbstractModule
import com.google.inject.Guice
import net.squarelabs.pgrepl.messages.Message
import net.squarelabs.pgrepl.messages.TxnMsg
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.ReplicationService
import org.eclipse.jetty.websocket.api.Session
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage
import org.eclipse.jetty.websocket.api.annotations.WebSocket
import org.eclipse.jetty.websocket.client.ClientUpgradeRequest
import org.eclipse.jetty.websocket.client.WebSocketClient
import org.junit.Assert
import org.junit.Test
import java.net.URI
import java.sql.DriverManager
import java.util.concurrent.TimeUnit

class AppTest {

    val app: App
    val replSvc: ReplicationService
    val conSvc: ConnectionService
    val cfgSvc: ConfigService

    init {
        val injector = Guice.createInjector(object : AbstractModule() {
            public override fun configure() {
            }
        })
        app = injector.getInstance(App::class.java)
        replSvc = injector.getInstance(ReplicationService::class.java)
        conSvc = injector.getInstance(ConnectionService::class.java)
        cfgSvc = injector.getInstance(ConfigService::class.java)
    }

    @Test
    fun shouldSync() {
        app.use {
            it.start()

            // Websocket client
            var actual = ""
            val client = WebSocketClient()
            client.start()
            val echoUri = URI("ws://localhost:8080/echo")
            val socket = @WebSocket object {
                var session: Session? = null

                @OnWebSocketConnect
                fun onConnect(session: Session) {
                    this.session = session
                }

                @OnWebSocketMessage
                fun onMessage(msg: String) {
                    actual = msg
                }
            }
            client.connect(socket, echoUri, ClientUpgradeRequest())

            //while(socket.session == null) TimeUnit.MILLISECONDS.sleep(10)
            //println("Connected! ${socket.session}")
            TimeUnit.MILLISECONDS.sleep(1000) // TODO: no hard coded waits!
            val conString = cfgSvc.getAppDbUrl()
            DriverManager.getConnection(conString).use {
                it.prepareStatement("INSERT INTO person (id, name) VALUES (1, 'Brent');").use {
                    it.executeUpdate()
                }
            }
            TimeUnit.MILLISECONDS.sleep(1000) // TODO: no hard coded waits!

            val expected = this.javaClass.getResource("/fixtures/txn.json").readText()
            val baseMsg: Message = Gson().fromJson(actual, Message::class.java)
            val clazz = when (baseMsg.type) {
                "TXN" -> TxnMsg::class.java
                else -> throw Exception("Unknown type: ${baseMsg.type}")
            }
            val msg = Gson().fromJson(actual, clazz)
            var actualObj: Transaction? = null
            when(msg) {
                is TxnMsg -> actualObj = msg.payload
            }
            val expectedObj: Transaction = Gson().fromJson(expected, Transaction::class.java)
                    .copy(xid = actualObj!!.xid)
            Assert.assertEquals("WebSocket should receive notifications", expectedObj, actualObj)
        }
        replSvc.close()
        conSvc.audit()
    }
}