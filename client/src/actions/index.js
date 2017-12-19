import uuidv4 from 'uuid/v4';

export const insertRow = (table, record) => {
    return {
        type: "INSERT",
        table,
        record
    }
};

export const updateRow = (table, record) => {
    return {
        type: "UPDATE",
        table,
        record
    }
};

export const deleteRow = (table, record) => {
    return {
        type: "DELETE",
        table,
        record
    }
};

export const createTxn = (changes) => {
    const txnId = uuidv4();
    for(let change of changes) {
        switch(change.type) {
            case "INSERT":
                change.record.prvTxnId = undefined;
                change.record.curTxnId = txnId;
                break;
            case "UPDATE":
                // TODO: get current state somehow
                // TODO: Find table in state
                // TODO: Find record in table
                // TODO: Copy old values and prvTxnId into update
                break;
            case "DELETE":
                change.record.prvTxnId = change.record.curTxnId;
                change.record.curTxnId = txnId;
                break;
            default:
                throw new Error(`Type not implemented: ${change.type}`)
        }
    }
    return {
        type: "COMMIT",
        txn: {
            id: txnId,
            changes
        }
    }
};