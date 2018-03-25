// import uuidv4 from 'uuid/v4';
// import {getPk} from "../util/db";

export const createInsertRowAction = (tableName, record) => {
    return {
        type: "INSERT",
        table: tableName,
        record: {...record}
    }
};

export const createUpdateRowAction = (tableName, record, memDb) => {
    const table = memDb.tables[tableName];
    const pk = getPk(record, table);
    const prior = table.rows[pk];
    return {
        type: "UPDATE",
        table: tableName,
        record: {...record},
        prior
    }
};

export const createDeleteRowAction = (table, record) => {
    return {
        type: "DELETE",
        table,
        record: {...record},
        prior: {...record}
    }
};

export const createClearDbAction = () => {
    return {
        type: 'CLEAR_DB'
    }
};

export const createDatabaseClearedAction = () => {
    return {
        type: 'CLEARED_DB'
    }
};

export const createTxnAction = (changes) => {
    const txnId = uuidv4();
    for(let change of changes) {
        switch(change.type) {
            case "INSERT":
                change.record.prvTxnId = undefined;
                change.record.curTxnId = txnId;
                break;
            case "UPDATE":
                change.record.prvTxnId = change.prior.curTxnId;
                change.record.curTxnId = txnId;
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