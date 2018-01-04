import {applyCommit, getPk, getRowByPk, deleteRow, rollbackLog, upsertRow} from '../util/db';
import {equals, unique} from "../util/math";

const createReducer = (initialState, db) => {
    console.log(`Creating reducer with initial LSN=${initialState.lsn}`);
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

const handleLocalCommit = (state, txn, db) => {
    const newState = applyCommit(state, txn);
    if(db !== undefined) saveCommit(newState, db, txn); // no db when rolling back and replaying
    return newState;
};

const handleSnapshot = (state, action, db) => {
    const newState = JSON.parse(JSON.stringify(state));
    if (newState.lsn) throw new Error('Cannot play snapshot onto already initialized database!');
    const snapshot = action.payload;
    console.log(`Initalizing redux store with snapshot LSN=${snapshot.lsn}`);
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

    console.log(`Saving snapshot LSN=${snapshot.lsn} to IndexedDb`);
    saveSnapshot(db, snapshot);
    return newState;
};

const applyChanges = (state, txn) => { // Mutates
    if (txn.lsn === 0) return; // Conflict on server, do not apply
    state.lsn = txn.lsn;
    state.xid = txn.xid;
    txn.changes.forEach(change => handleChange(state, change));
    return state; // TODO: Don't mutate!
};

const filterTxns = (log, txn, db) => {
    const newLog = log.filter(txn => txn.id !== txn.id);
    db.removeFromLog(txn.id);
    return newLog;
};

const handleServerTxn = (state, action, db) => {
    // validate
    const payload = action.payload;
    if (payload.lsn !== 0) { // zero for transaction failures
        if (payload.lsn <= state.lsn || payload.xid <= state.xid) {
            console.warn(`Received old txn from server: ${payload.lsn}`);
            return state;
        }
    } else {
        console.log(`Rolling back txn ${payload.id} due to conflict!`);
    }
    console.log(`Applying transaction from server LSN=${payload.lsn} txnId=${payload.id}`);

    const v1 = JSON.parse(JSON.stringify(state));
    const v2 = rollbackLog(v1); // Does not mutate
    const v3 = applyChanges(v2, payload); // Mutates
    const log = filterTxns(v1.log, payload, db); // Does not mutate (but saves to idb)
    const v5 = replayLog(v3, log); // Does not mutate

    // Save to IndexedDB
    const txn = diff(v1, v5);
    console.log(`Updating IndexedDb with a diff of ${txn.changes.length} changes`);
    saveCommit(v5, db, txn);

    return v5;
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

const replayLog = (state, log) => {
    return log.reduce((acc, cur) => handleLocalCommit(acc, cur), state);
};

const handleChange = (state, change) => {
    const table = state.tables[change.table] || {rows: []};
    state.tables[change.table] = table;
    switch (change.type) {
        case 'INSERT':
            upsertRow(change.record, table);
            break;
        case 'UPDATE':
            upsertRow(change.record, table);
            break;
        case 'DELETE':
            deleteRow(change.record, table);
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
    console.log(`Saving snapshot LSN=${snapshot.lsn} to IndexedDB...`);
    const metadata = await db.getMetadata();
    metadata.lsn = snapshot.lsn;
    db.setMetadata(metadata);
    db.saveSnapshot(snapshot);
};
