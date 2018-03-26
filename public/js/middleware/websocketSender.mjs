import {snapshotRequest, subscribeRequest} from "../actions/websocketActions.mjs";

export const createWebSocketSender = (socket) => {
    const webSocketSender = (store) => {
        const wrapDispatch = (next) => {
            const dispatch = (action) => {
                try {
                    switch (action.type) {
                        case 'CONNECT':
                            socket.connect();
                            break;
                        case 'DISCONNECT':
                            socket.close();
                            break;
                        case 'OPEN_DOC':
                            const state = store.getState();
                            const docId = action.docId;
                            const doc = state.db.documents[docId];
                            if (!doc || !doc.lsn) {
                                if (socket.connected) socket.write(snapshotRequest(docId));
                            }
                            return next(action);
                        case 'SNAPSHOT_RESPONSE':
                            console.log('Got snapshot, subscribing for changes');
                            if (socket.connected) socket.write(subscribeRequest(socket.id, action.payload.lsn));
                            return next(action);
                        case 'SUBSCRIBE_RESPONSE':
                            console.log('Subscribed for change notifications from server!');
                            const log = store.getState().log;
                            if (log.length > 0) {
                                console.log(`Flushing ${log.length} local transactions to server`);
                                const msg = {type: 'MULTI_COMMIT', txns: log};
                                socket.write(msg);
                            }
                            break;
                        case 'COMMIT':
                            console.log(`Sending txnId=${action.txn.id} to server`);
                            if (socket.connected) socket.write(action);
                            return next(action);
                        default:
                            return next(action);
                    }
                } catch (ex) {
                    // TODO: retry on reconnect
                    console.error("Error sending transaction to server!", ex);
                }
            };
            return dispatch;
        };
        return wrapDispatch;
    };
    return webSocketSender;
};
