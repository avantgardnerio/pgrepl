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
        default:
            console.log(`unknown action: ${action.type}`);
            return state;
    }
}

const handleSnapshot = (state, action) => {
    const newState = JSON.parse(JSON.stringify(state));
    const lsn = action.payload.lsn;
    const tables = action.payload.tables;
    for(let table of tables) {
        const name = table.name;
        const tab = state.tables[name] || {
            rows: []
        };
        state.tables[name] = tab;
        const columns = table.columns;
        const rows = table.rows;
        for(let row of rows) {
            const values = row.data;
            const record = columns.reduce((acc, cur, idx) => ({...acc, [cur.name]: values[idx]}), {});
            console.log(record);
            tab.rows.push(record);
        }
    }
    console.log(action);
    return newState;
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