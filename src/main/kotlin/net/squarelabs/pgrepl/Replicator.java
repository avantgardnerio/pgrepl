package net.squarelabs.pgrepl;

public class Replicator {
    public static abstract class EventListener {
        public abstract void onEvent(String json);
    }

    public void register(String uuid, EventListener listener) {

    }

    public void acknowledge(String uuid, String txnId) {

    }

    public void reconnect(String uuid) {

    }

    public void update(String json) {
        
    }
}
