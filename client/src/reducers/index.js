import {removeRow, updateRow} from '../util/db';

const initialState = {
    tables: {
        circles: {
            rows: []
        },
        rectangles: {
            rows: []
        }
    },
    log: [],
    lsn: 0,
    xid: 0
};

export default (state = initialState, action) => {
    switch (action.type) {
        case 'COMMIT':
            return handleLocalCommit(state, action.txn);
        case 'SNAP':
            return handleSnapshot(state, action);
        case 'TXN':
            return handleServerTxn(state, action);
        default:
            console.log(`unknown action: ${action.type}`);
            return state;
    }
}

const handleSnapshot = (state, action) => {
    const newState = JSON.parse(JSON.stringify(state));
    if (newState.lsn) throw new Error('Cannot play snapshot onto already initialized database!');
    newState.lsn = action.payload.lsn;
    for (let actionTable of action.payload.tables) {
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
    console.log(action);
    return newState;
};

const handleServerTxn = (state, action) => {
    // validate
    const payload = action.payload;
    let newState = JSON.parse(JSON.stringify(state));
    if (payload.lsn < state.lsn || payload.xid < state.xid)
        throw new Error(`Received old txn from server: ${payload.lsn}`);
    if (payload.lsn === state.lsn || payload.xid === state.xid)
        throw new Error(`Received duplicate txn from server: ${payload.lsn}`);
    if (payload.xid !== state.xid + 1)
        console.warn(`Skipping ${payload.xid - state.xid - 1} transactions :/`); // TODO: get initial xid?

    // rollback
    newState = rollbackLog(newState);

    // Apply
    newState.lsn = payload.lsn;
    newState.xid = payload.xid;
    console.log('handleTxn action=', action);
    const changes = payload.change;
    for (let change of changes) {
        handleChange(newState, change);
    }

    // Remove duplicate transactions
    newState.log = newState.log.filter(txn => txn.id !== payload.clientTxnId);

    // Replay log
    replayLog(newState);

    return newState;
};

const invert = (txn) => {
    const newTxn = JSON.parse(JSON.stringify(txn));
    for(let change of newTxn.changes) {
        switch(change.type) {
            case 'INSERT':
                change.type = 'DELETE';
                break;
            default:
                throw new Error(`Type not implemented: ${change.type}`)
        }
    }
    return newTxn;
};

const replayLog = (state) => {
    let newState = state;
    for(let txn of state.log) {
        newState = handleLocalCommit(newState, txn);
    }
    return newState;
};

const rollbackLog = (state) => {
    const log = state.log.slice();
    let txn = log.pop();
    while(txn !== undefined) {
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
            const names = change.columnnames;
            const values = change.columnvalues;
            const row = names
                .reduce((acc, cur, idx) => ({...acc, [cur]: values[idx]}), {});
            table.rows.push(row);
            break;
        default:
            throw new Error(`Unknown type: ${change.type}`);
    }
};

const handleLocalCommit = (state, txn) => {
    const newState = JSON.parse(JSON.stringify(state));
    for (let change of txn.changes) {
        applyChange(txn, newState, change);
    }
    newState.log.push(txn);
    return newState;
};

const applyChange = (txn, state, change) => {
    const table = state.tables[change.table] || {
        rows: []
    };
    state.tables[change.table] = table;
    switch (change.type) {
        case 'INSERT':
            table.rows.push(change.record); // TODO: Don't mutate?
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