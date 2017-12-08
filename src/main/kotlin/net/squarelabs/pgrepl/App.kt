package net.squarelabs.pgrepl

import org.eclipse.jetty.server.Server
import org.eclipse.jetty.servlet.DefaultServlet
import org.eclipse.jetty.servlet.ServletContextHandler
import org.eclipse.jetty.servlet.ServletHolder
import org.eclipse.jetty.websocket.jsr356.server.deploy.WebSocketServerContainerInitializer
import org.flywaydb.core.Flyway
import java.util.*
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
    }

    @Throws(Exception::class)
    fun join() {
        server.join()
    }
}
