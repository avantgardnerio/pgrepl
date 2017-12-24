package net.squarelabs.pgrepl

import com.google.inject.Inject
import com.google.inject.Singleton
import net.squarelabs.pgrepl.endpoints.ReplicationSocket
import net.squarelabs.pgrepl.factories.ReplicationSocketFactory
import net.squarelabs.pgrepl.services.ConfigService
import net.squarelabs.pgrepl.services.ConnectionService
import net.squarelabs.pgrepl.services.DbService
import net.squarelabs.pgrepl.services.ReplicationService
import org.eclipse.jetty.server.Server
import org.eclipse.jetty.servlet.DefaultServlet
import org.eclipse.jetty.servlet.ServletContextHandler
import org.eclipse.jetty.servlet.ServletHolder
import org.eclipse.jetty.util.log.Log
import org.eclipse.jetty.websocket.jsr356.server.deploy.WebSocketServerContainerInitializer
import org.flywaydb.core.Flyway
import java.util.*
import java.util.concurrent.TimeUnit
import javax.websocket.server.ServerEndpointConfig

@Singleton
class App @Inject constructor(
        val cfgSvc: ConfigService,
        val socket: ReplicationSocketFactory,
        val conSvc: ConnectionService,
        val replSvc: ReplicationService,
        val dbSvc: DbService
) : AutoCloseable {

    companion object {
        private val LOG = Log.getLogger(ReplicationSocket::class.java)
    }

    lateinit var server: Server

    @Throws(Exception::class)
    fun start() {
        // Database
        val dbName = cfgSvc.getAppDbName()
        if (!dbSvc.list().contains(dbName)) dbSvc.create(dbName)
        val flyway = Flyway()
        flyway.setDataSource(cfgSvc.getAppDbUrl(), null, null)
        flyway.migrate()

        // Jetty
        server = Server(8080)
        val context = ServletContextHandler(ServletContextHandler.SESSIONS)
        context.contextPath = "/"
        server.handler = context
        val container = WebSocketServerContainerInitializer.configureContext(context)
        container.addEndpoint(ServerEndpointConfig.Builder
                .create(ReplicationSocket::class.java, "/echo")
                .configurator(socket)
                .build())
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

    override fun close() {
        LOG.info("Shutting down App...")
        server.stop()
        while (server.isStopped == false) TimeUnit.MILLISECONDS.sleep(10)

        // TODO: Guice should close AutoClosables it allocates
        replSvc.close()
    }

}
