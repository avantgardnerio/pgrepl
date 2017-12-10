import uuidv4 from 'uuid/v4';

export const insertRow = (table, record) => {
    return {
        type: "INSERT",
        table,
        record
    }
};

export const updateRow = (table, record) => {
    return {
        type: "UPDATE",
        table,
        record
    }
};

export const deleteRow = (table, pk) => {
    return {
        type: "UPDATE",
        table,
        pk
    }
};

export const createTxn = (changes) => {
    return {
        type: "COMMIT",
        txn: {
            id: uuidv4(),
            changes
        }
    }
};