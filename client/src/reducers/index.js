const initialState = {
    tables: {},
    log: [],
    lsn: 0
};

export default (state = initialState, action) => {
    switch (action.type) {
        case 'COMMIT':
            return applyTxn(state, action);
        default:
            return state;
    }
}

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