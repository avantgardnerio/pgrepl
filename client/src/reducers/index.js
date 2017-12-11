const initialState = {
    tables: {},
    log: [],
    lsn: 0
};

export default (state = initialState, action) => {
    switch (action.type) {
        case 'COMMIT':
            return applyTxn(state, action);
        case 'SNAP':
            return handleSnapshot(state, action);
        case 'TXN':
            return handleTxn(state, action);
        default:
            console.log(`unknown action: ${action.type}`);
            return state;
    }
}

const handleSnapshot = (state, action) => {
    const newState = JSON.parse(JSON.stringify(state));
    //const lsn = action.payload.lsn;
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

const handleTxn = (state, action) => {
    const newState = JSON.parse(JSON.stringify(state));
    console.log('handleTxn action=', action);
    const changes = action.payload.change;
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

const applyTxn = (state, action) => {
    const newState = JSON.parse(JSON.stringify(state));
    const txn = action.txn;
    txn.lsn = state.lsn + 1;
    for (let change of txn.changes) {
        applyChange(newState, change);
    }
    newState.lsn = txn.lsn;
    newState.log.push(txn);
    return newState;
};

const applyChange = (state, change) => {
    const table = state.tables[change.table] || {
        rows: []
    };
    state.tables[change.table] = table;
    switch(change.type) {
        case 'INSERT':
            table.rows.push(change.record);
            break;
        case 'UPDATE':
            break;
        case 'DELETE':
            break;
        default:
            throw new Error(`Unknown type: ${change.type}`);
    }
};