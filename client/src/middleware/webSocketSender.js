import {subscribeRequest} from "../actions/websocket";

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
                        case 'SNAPSHOT_RESPONSE':
                            console.log('Got snapshot, subscribing for changes');
                            socket.write(subscribeRequest(socket.id, store.getState().lsn));
                            return next(action);
                        case 'COMMIT':
                            console.log('Sending', action.txn.id);
                            socket.write(action);
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
