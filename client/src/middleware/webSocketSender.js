export const createWebSocketSender = (socket) => {
    const webSocketSender = () => {
        const wrapDispatch = (next) => {
            const dispatch = (action) => {
                switch (action.type) {
                    case 'COMMIT':
                        try {
                            console.log('Sending', action.txn.id);
                            socket.write(action);
                            return next(action);
                        } catch (ex) {
                            // TODO: retry on reconnect
                            console.error("Error sending transaction to server!", ex);
                        }
                        break;
                    default:
                        return next(action);
                }
            };
            return dispatch;
        };
        return wrapDispatch;
    };
    return webSocketSender;
};
