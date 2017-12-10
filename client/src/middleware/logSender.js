export const logSender = (socket) => () => (next) => (action) => {
    switch (action.type) {
        case 'COMMIT':
            try {
                socket.write(action);
            } catch(ex) {
                // TODO: retry on reconnect
                console.error("Error sending transaction to server!", ex);
            }
            break;
        default:
            return next(action);
    }
};