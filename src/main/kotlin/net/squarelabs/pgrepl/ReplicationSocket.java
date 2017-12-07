package net.squarelabs.pgrepl;

import org.eclipse.jetty.util.log.Log;
import org.eclipse.jetty.util.log.Logger;
import org.postgresql.PGProperty;
import org.postgresql.core.BaseConnection;
import org.postgresql.core.ServerVersion;
import org.postgresql.replication.LogSequenceNumber;
import org.postgresql.replication.PGReplicationStream;

import javax.websocket.*;
import java.nio.ByteBuffer;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Properties;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class ReplicationSocket extends Endpoint implements MessageHandler.Whole<String> {
    private static final Logger LOG = Log.getLogger(ReplicationSocket.class);
    private Session session;
    private RemoteEndpoint.Async remote;

    // TODO: Guice
    private static ScheduledExecutorService executor = Executors.newScheduledThreadPool(1);

    @Override
    public void onClose(Session session, CloseReason close) {
        super.onClose(session, close);
        this.session = null;
        this.remote = null;
        // TODO: Clear scheduled task
        LOG.info("WebSocket Close: {} - {}", close.getCloseCode(), close.getReasonPhrase());
    }

    // TODO: Helper method
    private static String toString(ByteBuffer buffer) {
        int offset = buffer.arrayOffset();
        byte[] source = buffer.array();
        int length = source.length - offset;

        return new String(source, offset, length);
    }

    public void onOpen(Session session, EndpointConfig config) {
        try {
            this.session = session;
            this.remote = this.session.getAsyncRemote();
            LOG.info("WebSocket Connect: {}", session);
            this.remote.sendText("You are now connected to " + this.getClass().getName());
            // attach echo message handler
            session.addMessageHandler(this);

            // TODO: Can't use one slot per client
            Properties properties = new Properties();
            properties.setProperty("user", "postgres");
            properties.setProperty("password", "postgres");
            PGProperty.ASSUME_MIN_SERVER_VERSION.set(properties, "9.4");
            PGProperty.REPLICATION.set(properties, "database");
            PGProperty.PREFER_QUERY_MODE.set(properties, "simple");
            String url = "jdbc:postgresql://localhost/pgrepl_test";
            BaseConnection replCon = (BaseConnection) DriverManager.getConnection(url, properties);

            // TODO: connection pool
            BaseConnection queryCon = (BaseConnection) DriverManager.getConnection(url, "postgres", "postgres");

            String slotName = "slot" + session.getId();

            String conString = "jdbc:postgresql://localhost:5432/pgrepl_test?user=postgres&password=postgres";
            SlotHelper slot = new SlotHelper(conString);
            slot.drop(slotName);
            slot.create(slotName, "wal2json");

            LogSequenceNumber lsn = getCurrentLSN(queryCon);
            PGReplicationStream stream = replCon
                    .getReplicationAPI()
                    .replicationStream()
                    .logical()
                    .withSlotName(slotName)
                    .withStartPosition(lsn)
                    .withSlotOption("include-xids", true)
                    //.withSlotOption("skip-empty-xacts", true)
                    .withStatusInterval(20, TimeUnit.SECONDS)
                    .start();
            // TODO: read as fast as possible, not every 10ms
            Runnable task = () -> {
                try {
                    ByteBuffer buffer = stream.readPending();
                    if(buffer == null) return;
                    String str = toString(buffer);
                    System.out.println(str);

                    // TODO: Only clear on confirm from client
                    stream.setAppliedLSN(stream.getLastReceiveLSN());
                    stream.setFlushedLSN(stream.getLastReceiveLSN());
                } catch (Exception ex) {
                    // TODO: Kill timer
                    // TODO: slf4jsimple
                    System.out.println(ex.toString());
                }
            };
            executor.scheduleAtFixedRate(task, 0, 10, TimeUnit.MILLISECONDS);
        } catch (Exception ex) {
            // TODO: slf4jsimple
            // TODO: error handling
            System.out.println(ex.toString());
        }
    }

    // TODO: Refactor
    private LogSequenceNumber getCurrentLSN(BaseConnection con) throws SQLException {
        // TODO: pg_current_wal_lsn() after 10+
        boolean tenPlus = con.haveMinimumServerVersion(ServerVersion.v10);
        // TODO: kotlin string interpolation
        String fun = tenPlus ? "pg_current_wal_lsn()" : "pg_current_xlog_location()";
        String sql = "SELECT " + fun;
        try (
                Statement st = con.createStatement();
                ResultSet rs = st.executeQuery(sql)
        ) {
            if (rs.next()) {
                String lsn = rs.getString(1);
                return LogSequenceNumber.valueOf(lsn);
            } else {
                return LogSequenceNumber.INVALID_LSN;
            }
        }
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