package net.squarelabs.pgrepl;

import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.websocket.jsr356.server.ServerContainer;
import org.eclipse.jetty.websocket.jsr356.server.deploy.WebSocketServerContainerInitializer;

import javax.websocket.server.ServerEndpointConfig;
import java.net.URL;
import java.util.Objects;

public class Main {
    public static void main(String[] args) throws Exception {
        Server server = new Server(8080);
        server.setHandler(new HelloHandler());

        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);
        ServerContainer container = WebSocketServerContainerInitializer.configureContext(context);
        ServerEndpointConfig echoConfig = ServerEndpointConfig.Builder.create(ReplicationSocket.class, "/echo").build();
        container.addEndpoint(echoConfig);
        URL urlStatics = Thread.currentThread().getContextClassLoader().getResource("index.html");
        Objects.requireNonNull(urlStatics, "Unable to find index.html in classpath");
        String urlBase = urlStatics.toExternalForm().replaceFirst("/[^/]*$", "/");
        ServletHolder defHolder = new ServletHolder("default", new DefaultServlet());
        defHolder.setInitParameter("resourceBase", urlBase);
        defHolder.setInitParameter("dirAllowed", "true");
        context.addServlet(defHolder, "/");

        server.start();
        server.join();
    }
}
