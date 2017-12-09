package net.squarelabs.pgrepl

import com.google.gson.Gson
import com.google.inject.AbstractModule
import com.google.inject.Guice
import net.squarelabs.pgrepl.model.Transaction
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.ReplicationService
import org.eclipse.jetty.websocket.api.Session
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose
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
    @Test
    fun shouldSync() {
        val injector = Guice.createInjector(object : AbstractModule() {
            public override fun configure() {
                //bind(ConfigService::class.java).to(ConfigService::class.java)
            }
        })
        injector.getInstance(App::class.java).use {
            it.start()

            // Websocket client
            var actual = ""
            val client = WebSocketClient()
            client.start()
            val echoUri = URI("ws://localhost:8080/echo")
            val request = ClientUpgradeRequest()
            val socket = @WebSocket object {
                private var session: Session? = null

                @OnWebSocketClose
                fun onClose(statusCode: Int, reason: String) {
                    System.out.printf("Connection closed: %d - %s%n", statusCode, reason)
                    this.session = null
                }

                @OnWebSocketConnect
                fun onConnect(session: Session) {
                    System.out.printf("Got connect: %s%n", session)
                    this.session = session
                    try {
                    } catch (t: Throwable) {
                        t.printStackTrace()
                    }

                }

                @OnWebSocketMessage
                fun onMessage(msg: String) {
                    actual = msg
                }
            }
            client.connect(socket, echoUri, request)

            TimeUnit.MILLISECONDS.sleep(1000) // TODO: no hard coded waits!
            val cfgSvc = injector.getInstance(ConfigService::class.java)
            val conString = cfgSvc.getAppDbUrl()
            DriverManager.getConnection(conString).use {
                it.prepareStatement("INSERT INTO person (id, name) VALUES (1, 'Brent');").use {
                    it.executeUpdate()
                }
            }
            TimeUnit.MILLISECONDS.sleep(1000) // TODO: no hard coded waits!

            val expected = this.javaClass.getResource("/fixtures/txn.json").readText()
            val actualObj: Transaction = Gson().fromJson(actual, Transaction::class.java)
            val expectedObj: Transaction = Gson().fromJson(expected, Transaction::class.java)
                    .copy(xid = actualObj.xid)
            Assert.assertEquals("WebSocket should receive notifications", expectedObj, actualObj)
        }
        injector.getInstance(ReplicationService::class.java).close()
        injector.getInstance(ConnectionService::class.java).audit()
    }
}