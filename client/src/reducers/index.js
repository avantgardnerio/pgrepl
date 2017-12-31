import {getPk, getRowByPk, insertRow, removeRow, updateRow} from '../util/db';
import {equals, unique} from "../util/math";

const createReducer = (initialState, db) => {
    console.log('Creating reducer with initial lsn=', initialState.lsn);
    const reducer = (state = initialState, action) => {
        switch (action.type) {
            case 'COMMIT':
                return handleLocalCommit(state, action.txn, db);
            case 'SNAPSHOT_RESPONSE':
                return handleSnapshot(state, action, db);
            case 'TXN':
                return handleServerTxn(state, action, db);
            case 'CLEARED_DB':
                return {...state, cleared: true};
            case 'PONG':
                return state;
            case 'CONNECTED':
                return {...state, connected: true};
            case 'DISCONNECTED':
                return {...state, connected: false};
            default:
                console.log(`unknown action: ${action.type}`);
                return state;
        }
    };
    return reducer;
};

export default createReducer;

const handleSnapshot = (state, action, db) => {
    const newState = JSON.parse(JSON.stringify(state));
    if (newState.lsn) throw new Error('Cannot play snapshot onto already initialized database!');
    const snapshot = action.payload;
    newState.lsn = snapshot.lsn;
    for (let actionTable of snapshot.tables) {
        const tableName = actionTable.name;
        const stateTable = newState.tables[tableName] || {
            rows: []
        };
        newState.tables[tableName] = stateTable;
        stateTable.columns = actionTable.columns;
        const rows = actionTable.rows;
        for (let row of rows) {
            const values = row.data;
            const record = stateTable.columns.reduce((acc, cur, idx) => ({...acc, [cur.name]: values[idx]}), {});
            //console.log(record);
            stateTable.rows.push(record);
        }
    }
    //console.log(action);
    saveSnapshot(db, snapshot);
    return newState;
};

const handleServerTxn = (state, action, db) => {
    // validate
    const payload = action.payload;
    let newState = JSON.parse(JSON.stringify(state));
    if(payload.lsn !== 0) { // zero for transaction failures
        if (payload.lsn < state.lsn || payload.xid < state.xid)
            throw new Error(`Received old txn from server: ${payload.lsn}`);
        if (payload.lsn === state.lsn || payload.xid === state.xid)
            throw new Error(`Received duplicate txn from server: ${payload.lsn}`);
        if (payload.xid !== state.xid + 1)
            console.warn(`Skipping ${payload.xid - state.xid - 1} transactions :/`); // TODO: get initial xid?
    } else {
        console.log(`Rolling back txn ${payload.clientTxnId} due to conflict!`);
    }

    // rollback
    newState = rollbackLog(newState);

    // Apply
    if(payload.lsn !== 0) {
        newState.lsn = payload.lsn;
        newState.xid = payload.xid;
        console.log('handleTxn action=', action);
        const changes = payload.change;
        for (let change of changes) {
            handleChange(newState, change);
        }
    }

    // Remove duplicate transactions
    newState.log = newState.log.filter(txn => txn.id !== payload.clientTxnId);
    db.removeFromLog(payload.clientTxnId);

    // Replay log
    replayLog(newState);

    // Save to IndexedDB
    const txn = diff(state, newState);
    saveCommit(newState, db, txn);

    return newState;
};

const diff = (prior, post) => {
    const tableNames = unique([...Object.keys(prior.tables), ...Object.keys(post.tables)]);
    const txn = {
        changes: []
    };
    tableNames.forEach(tableName => {
        const priorTable = prior.tables[tableName];
        const postTable = post.tables[tableName];
        for (let postRow of postTable.rows) {
            const pk = getPk(postRow, postTable);
            const priorRow = getRowByPk(pk, priorTable);
            if (!priorRow) {
                const change = {
                    type: 'INSERT',
                    table: tableName,
                    record: postRow
                };
                txn.changes.push(change);
            } else if (!equals(priorRow, postRow)) {
                const change = {
                    type: 'UPDATE',
                    table: tableName,
                    record: postRow,
                    prior: priorRow
                };
                txn.changes.push(change);
            }
        }
        for (let priorRow of priorTable.rows) {
            const pk = getPk(priorRow, priorTable);
            const postRow = getRowByPk(pk, postTable);
            if (!postRow) {
                const change = {
                    type: 'DELETE',
                    table: tableName,
                    record: priorRow
                };
                txn.changes.push(change);
            }
        }
    });
    return txn;
};

const invert = (txn) => {
    const newTxn = JSON.parse(JSON.stringify(txn));
    for (let change of newTxn.changes) {
        switch (change.type) {
            case 'INSERT':
                change.type = 'DELETE';
                break;
            case 'UPDATE':
                const post = change.record;
                change.record = change.prior;
                change.prior = post;
                break;
            case 'DELETE':
                change.type = 'INSERT';
                break;
            default:
                throw new Error(`Type not implemented: ${change.type}`)
        }
    }
    return newTxn;
};

const replayLog = (state) => {
    let newState = state;
    for (let txn of state.log) {
        newState = handleLocalCommit(newState, txn);
    }
    return newState;
};

const rollbackLog = (state) => {
    const log = state.log.slice();
    let txn = log.pop();
    while (txn !== undefined) {
        txn = invert(txn);
        state = handleLocalCommit(state, txn);
        txn = log.pop();
    }
    return state;
};

const handleChange = (state, change) => {
    const table = state.tables[change.table] || {
        rows: []
    };
    state.tables[change.table] = table;
    switch (change.kind) {
        case 'insert':
            handleInsert(table, change);
            break;
        case 'update':
            handleUpdate(table, change);
            break;
        case 'delete':
            handleDelete(table, change);
            break;
        default:
            throw new Error(`Unknown type: ${change.type}`);
    }
};

const handleDelete = (table, change) => {
    const names = change.oldkeys.keynames;
    const values = change.oldkeys.keyvalues;
    const row = names
        .reduce((acc, cur, idx) => ({...acc, [cur]: values[idx]}), {});
    removeRow(row, table);
};

const handleUpdate = (table, change) => {
    const names = change.columnnames;
    const values = change.columnvalues;
    const row = names
        .reduce((acc, cur, idx) => ({...acc, [cur]: values[idx]}), {});
    updateRow(row, table);
};

const handleInsert = (table, change) => {
    const names = change.columnnames;
    const values = change.columnvalues;
    const row = names
        .reduce((acc, cur, idx) => ({...acc, [cur]: values[idx]}), {});
    table.rows.push(row);
};

const handleLocalCommit = (state, txn, db) => {
    const newState = JSON.parse(JSON.stringify(state));
    try {
        for (let change of txn.changes) {
            applyChange(txn, newState, change);
        }
        newState.log.push(txn);
        if (db) saveCommit(state, db, txn); // No DB during rollback and replay
        return newState;
    } catch(ex) {
        console.log('Conflict while applying local commit txnId=', txn.id);
        return state;
    }
};

const applyChange = (txn, state, change) => {
    const table = state.tables[change.table] || {
        rows: []
    };
    state.tables[change.table] = table;
    switch (change.type) {
        case 'INSERT':
            insertRow(change.record, table);
            break;
        case 'UPDATE':
            updateRow(change.record, table);
            break;
        case 'DELETE':
            removeRow(change.record, table);
            break;
        default:
            throw new Error(`Unknown type: ${change.type}`);
    }
};

// ---------------------------------------- IndexedDB -----------------------------------------------------------------
const saveCommit = async (state, db, txn) => {
    console.log(`Saving txn ${txn.id} to IndexedDB...`);
    db.saveTxn(txn, state);
};

const saveSnapshot = async (db, snapshot) => {
    console.log(`Saving snapshot ${snapshot.lsn} to IndexedDB...`);
    const metadata = await db.getMetadata();
    metadata.lsn = snapshot.lsn;
    db.setMetadata(metadata);
    db.saveSnapshot(snapshot);
};
