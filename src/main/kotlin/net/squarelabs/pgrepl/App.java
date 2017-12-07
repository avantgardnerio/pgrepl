package net.squarelabs.pgrepl;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.websocket.jsr356.server.ServerContainer;
import org.eclipse.jetty.websocket.jsr356.server.deploy.WebSocketServerContainerInitializer;
import org.flywaydb.core.Flyway;

import javax.websocket.server.ServerEndpointConfig;
import java.net.URL;
import java.util.Objects;

public class App {
    Server server;
    
    public void start() throws Exception {
        // Database
        // TODO: db info from environment variables
        // TODO: test on heroku?
        // TODO: get config from env vars
        DbHelper db = new DbHelper("jdbc:postgresql://localhost:5432/postgres?user=postgres&password=postgres");
        db.drop("pgrepl_test");
        db.create("pgrepl_test");
        Flyway flyway = new Flyway();
        flyway.setDataSource("jdbc:postgresql://localhost:5432/pgrepl_test", "postgres", "postgres");
        flyway.migrate();

        // Jetty
        server = new Server(8080);
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);
        ServerContainer container = WebSocketServerContainerInitializer.configureContext(context);
        ServerEndpointConfig echoConfig = ServerEndpointConfig.Builder.create(ReplicationSocket.class, "/echo").build();
        container.addEndpoint(echoConfig);
        URL urlStatics = Thread.currentThread().getContextClassLoader().getResource("static/index.html");
        Objects.requireNonNull(urlStatics, "Unable to find index.html in classpath");
        String urlBase = urlStatics.toExternalForm().replaceFirst("/[^/]*$", "/");
        ServletHolder defHolder = new ServletHolder("default", new DefaultServlet());
        defHolder.setInitParameter("resourceBase", urlBase);
        defHolder.setInitParameter("dirAllowed", "true");
        context.addServlet(defHolder, "/");

        // Start Jetty
        server.start();
    }

    public void join() throws Exception {
        server.join();
    }
}
