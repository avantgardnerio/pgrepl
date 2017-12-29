import uuidv4 from 'uuid/v4';
import {getPk, getRowByPk} from "../util/db";

export const insertRow = (table, record) => {
    return {
        type: "INSERT",
        table,
        record
    }
};

export const updateRow = (tableName, record, db) => {
    const table = db.tables[tableName];
    const pk = getPk(record, table);
    const prior = getRowByPk(pk, table);
    return {
        type: "UPDATE",
        table: tableName,
        record,
        prior
    }
};

export const deleteRow = (table, record) => {
    return {
        type: "DELETE",
        table,
        record
    }
};

export const clearDb = () => {
    return {
        type: 'CLEAR_DB'
    }
};

export const createTxn = (changes) => {
    const txnId = uuidv4();
    for(let change of changes) {
        switch(change.type) {
            case "INSERT":
                change.record.prvtxnid = undefined;
                change.record.curtxnid = txnId;
                break;
            case "UPDATE":
                change.record.prvtxnid = change.prior.curtxnid;
                change.record.curtxnid = txnId;
                break;
            case "DELETE":
                change.record.prvtxnid = change.record.curtxnid;
                change.record.curtxnid = txnId;
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