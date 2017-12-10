export const logSender = (socket) => () => (next) => (action) => {
    switch (action.type) {
        case 'COMMIT':
            socket.write(action);
            break;
        default:
            return next(action);
    }
};