import _ from 'lodash';
import {deleteRow} from "../actions/database";

// TODO: cache somewhere for speed
export const getPkCols = (table) => _
    .sortBy(table.columns, o => o.pkOrdinal)
    .filter(col => col.pkOrdinal !== undefined)
    .map(col => col.name);

// TODO: super slow, cache
export const getRowByPk = (pk, table) => table.rows.find(row => arrayEq(pk, getPk(row, table)));

export const getPk = (rec, table) => getPkCols(table).map(key => rec[key]);

export const arrayEq = (a, b) => _.range(Math.max(a.length, b.length))
    .reduce((acc, cur) => acc && a[cur] === b[cur], true);

export const removeRow = (row, table) => {
    const pk = getPk(row, table);
    const oldRow = getRowByPk(pk, table);
    if (row.prvTxnId !== oldRow.curTxnId) return false;
    table.rows = table.rows.filter(row => !arrayEq(pk, getPk(row, table)));
    return true;
};

export const updateRow = (row, table) => {
    const pk = getPk(row, table);
    const oldRow = getRowByPk(pk, table);
    if (row.prvTxnId !== oldRow.curTxnId) return false;
    table.rows = table.rows.map(r => arrayEq(pk, getPk(r, table)) ? {...row} : r);
    return true;
};

export const insertRow = (row, table) => {
    const pk = getPk(row, table);
    const oldRow = getRowByPk(pk, table);
    if (oldRow) return false;
    table.rows.push({...row});
    return true;
};

export const rollbackLog = (state) => {
    const newState = _
        .range(state.log.length)
        .reverse()
        .map(idx => state.log[idx])
        .map(txn => invert(txn))
        .reduce((acc, cur) => applyCommit(acc, cur), state);
    return {...newState, log: []};
};

const inverse = {
    "INSERT": "DELETE",
    "UPDATE": "UPDATE",
    "DELETE": "INSERT"
};

export const invert = (txn) => {
    const changes = txn.changes.map(change => {
        return {
            ...change,
            type: inverse[change.type],
            record: change.prior ? change.prior : change.record,
            prior: change.prior ? change.record : change.prior
        }
    });
    return {...txn, changes};
};

export const applyCommit = (state, txn) => {
    const newState = JSON.parse(JSON.stringify(state));
    const success = txn.changes.reduce((acc, cur) => acc && applyChange(txn, newState, cur), true);
    if(!success) {
        console.log('Conflict while applying local commit txnId=', txn.id);
        return state;
    }
    newState.log.push(JSON.parse(JSON.stringify(txn)));
    return newState;
};

const handlers = {
    'INSERT': insertRow,
    'UPDATE': updateRow,
    'DELETE': deleteRow
};

const applyChange = (txn, state, change) => {
    const table = state.tables[change.table];
    const func = handlers[change.type];
    return func(change.record, table);
};
