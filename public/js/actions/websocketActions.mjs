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

export const snapshotRequest = (docId) => {
    if(!docId) throw new Error(`Invalid snapshot request: no docId!`);
    return {
        type: 'SNAPSHOT_REQUEST',
        docId
    }
};

export const subscribeRequest = (clientId, docId, lsn) => {
    return {
        type: 'SUBSCRIBE_REQUEST',
        clientId,
        docId,
        lsn
    }
};