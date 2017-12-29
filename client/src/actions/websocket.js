export const connected = () => {
    return {
        type: 'CONNECTED'
    }
};

export const disconnected = () => {
    return {
        type: 'DISCONNECTED'
    }
};

export const connect = () => {
    return {
        type: 'CONNECT'
    }
};

export const disconnect = () => {
    return {
        type: 'DISCONNECT'
    }
};

export const snapshotRequest = () => {
    return {
        type: 'SNAPSHOT_REQUEST'
    }
};

export const subscribeRequest = (clientId, lsn) => {
    return {
        type: 'SUBSCRIBE_REQUEST',
        clientId,
        lsn
    }
};