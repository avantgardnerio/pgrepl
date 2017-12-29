export const createLogSender = (socket) => {
    const logSender = () => {
        const wrapDispatch = (next) => {
            const dispatch = (action) => {
                switch (action.type) {
                    case 'COMMIT':
                        try {
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
    return logSender;
};
