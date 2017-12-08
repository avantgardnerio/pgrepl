package net.squarelabs.pgrepl

import org.eclipse.jetty.server.Server
import org.eclipse.jetty.servlet.DefaultServlet
import org.eclipse.jetty.servlet.ServletContextHandler
import org.eclipse.jetty.servlet.ServletHolder
import org.eclipse.jetty.util.log.Log
import org.eclipse.jetty.websocket.client.io.ConnectionManager
import org.eclipse.jetty.websocket.jsr356.server.deploy.WebSocketServerContainerInitializer
import org.flywaydb.core.Flyway
import java.nio.ByteBuffer
import java.sql.Connection
import java.sql.DriverManager
import java.util.*
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import javax.websocket.server.ServerEndpointConfig

class App {
    lateinit var server: Server

    @Throws(Exception::class)
    fun start() {
        // Database
        // TODO: db info from environment variables
        // TODO: test on heroku?
        // TODO: get config from env vars
        val db = DbHelper("jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres")
        db.drop("pgrepl_test")
        db.create("pgrepl_test")
        val flyway = Flyway()
        flyway.setDataSource("jdbc:postgresql://localhost:5432/pgrepl_test", "postgres", "postgres")
        flyway.migrate()

        // Jetty
        server = Server(8080)
        val context = ServletContextHandler(ServletContextHandler.SESSIONS)
        context.contextPath = "/"
        server.handler = context
        val container = WebSocketServerContainerInitializer.configureContext(context)
        val echoConfig = ServerEndpointConfig.Builder.create(ReplicationSocket::class.java, "/echo").build()
        container.addEndpoint(echoConfig)
        val urlStatics = Thread.currentThread().contextClassLoader.getResource("static/index.html")
        Objects.requireNonNull(urlStatics, "Unable to find index.html in classpath")
        val urlBase = urlStatics!!.toExternalForm().replaceFirst("/[^/]*$".toRegex(), "/")
        val defHolder = ServletHolder("default", DefaultServlet())
        defHolder.setInitParameter("resourceBase", urlBase)
        defHolder.setInitParameter("dirAllowed", "true")
        context.addServlet(defHolder, "/")

        // Start Jetty
        server.start()
        println("IsRunning ${server.isRunning} ${server.isStarted}")

        // Start making changes so we can see what the tx log notifications look like
        // TODO: All types of updates: insert, update, delete
        // TODO: Related records and constraint violations
        // TODO: Transactions with multiple changes
        // TODO: Create client-side DB and move this "test" there
        // TODO: implement autoclosable and stop the timer and close the connection
        executor.scheduleAtFixedRate({
            try {
                val conString = "jdbc:postgresql://localhost:5432/pgrepl_test?user=postgres&password=postgres";
                DriverManager.getConnection(conString).use {
                    it.prepareStatement("insert into person (id, name) values (1, 'Brent');").use {
                        it.executeUpdate()
                    }
                }
            } catch (ex: Exception) {
                // TODO: Kill timer
                // TODO: slf4jsimple
                println(ex.toString())
            }
        }, 0, 3, TimeUnit.SECONDS)
    }

    @Throws(Exception::class)
    fun join() {
        server.join()
    }

    companion object {
        private val executor = Executors.newScheduledThreadPool(1)
    }

}
