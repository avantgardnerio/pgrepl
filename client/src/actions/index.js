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

export const deleteRow = (table, pk) => {
    return {
        type: "UPDATE",
        table,
        pk
    }
};

export const createTxn = (changes) => {
    const txnId = uuidv4();
    for(let change of changes) {
        switch(change.type) {
            case "INSERT":
                change.record.curTxnId = txnId;
                change.record.prvTxnId = undefined;
                break;
            case "UPDATE":
                // TODO: get current state somehow
                // TODO: Find table in state
                // TODO: Find record in table
                // TODO: Copy old values and prvTxnId into update
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