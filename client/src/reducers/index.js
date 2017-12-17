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
            return handleLocalCommit(state, action);
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
    if(newState.lsn) throw new Error('Cannot play snapshot onto already initialized database!');
    newState.lsn = action.payload.lsn;
    for(let actionTable of action.payload.tables) {
        const tableName = actionTable.name;
        const stateTable = newState.tables[tableName] || {
            rows: []
        };
        newState.tables[tableName] = stateTable;
        const columns = actionTable.columns;
        const rows = actionTable.rows;
        for(let row of rows) {
            const values = row.data;
            const record = columns.reduce((acc, cur, idx) => ({...acc, [cur.name]: values[idx]}), {});
            //console.log(record);
            stateTable.rows.push(record);
        }
    }
    console.log(action);
    return newState;
};

const handleServerTxn = (state, action) => {
    const payload = action.payload;
    const newState = JSON.parse(JSON.stringify(state));
    if(payload.lsn < state.lsn || payload.xid < state.xid)
        throw new Error(`Received old txn from server: ${payload.lsn}`);
    if(payload.lsn === state.lsn || payload.xid === state.xid)
        throw new Error(`Received duplicate txn from server: ${payload.lsn}`);
    if(payload.xid !== state.xid+1)
        console.warn(`Skipping ${payload.xid-state.xid-1} transactions :/`); // TODO: get initial xid?
    newState.lsn = payload.lsn;
    newState.xid = payload.xid;
    console.log('handleTxn action=', action);
    const changes = payload.change;
    for(let change of changes) {
        handleChange(newState, change);
    }
    return newState;
};

const handleChange = (state, change) => {
    const table = state.tables[change.table] || {
        rows: []
    };
    state.tables[change.table] = table;
    switch(change.kind) {
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

const handleLocalCommit = (state, action) => {
    const newState = JSON.parse(JSON.stringify(state));
    const txn = action.txn;
    txn.lsn = state.lsn + 1;
    for (let change of txn.changes) {
        applyChange(txn, newState, change);
    }
    newState.lsn = txn.lsn;
    newState.log.push(txn);
    return newState;
};

const applyChange = (txn, state, change) => {
    const table = state.tables[change.table] || {
        rows: []
    };
    state.tables[change.table] = table;
    switch(change.type) {
        case 'INSERT':
            change.record.curTxnId = txn.id;
            change.record.prvTxnId = undefined;
            table.rows.push(change.record);
            break;
        case 'UPDATE':
            // TODO: prvTxnId = curTxnId; curTxnId = txn.id
            throw new Error('Update not implemented!'); // TODO: Implement update
        case 'DELETE':
            throw new Error('Delete not implemented!'); // TODO: Implement update
        default:
            throw new Error(`Unknown type: ${change.type}`);
    }
};