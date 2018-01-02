import _ from 'lodash';

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

export const removeRow = (row, table, force = false) => {
    const pk = getPk(row, table);
    const oldRow = getRowByPk(pk, table);
    if (!force && row.prvtxnid !== oldRow.curtxnid) {
        console.log(`tried to update oldRow=`, oldRow, ` with newRow=`, row);
        throw new Error("Can't delete, curTxnId mismatch!");
    }
    console.log(`Deleting oldRow=`, oldRow, ` pk=`, pk);
    table.rows = table.rows.filter(row => !arrayEq(pk, getPk(row, table)));
};

export const updateRow = (row, table, force = false) => {
    const pk = getPk(row, table);
    const oldRow = getRowByPk(pk, table);
    if (!force && row.prvtxnid !== oldRow.curtxnid) {
        console.log(`tried to update oldRow=`, oldRow, ` with newRow=`, row);
        throw new Error(`Can't update ${table.name}, change is meant to be played on ${row.prvtxnid} but ${oldRow.curtxnid} was present in DB`);
    }
    console.log(`Updating oldRow=`, oldRow, ` newRow=`, row);
    table.rows = table.rows.map(r => arrayEq(pk, getPk(r, table)) ? {...row} : r);
};

export const insertRow = (row, table, force = false) => {
    const pk = getPk(row, table);
    const oldRow = getRowByPk(pk, table);
    if (!force && oldRow) {
        console.log(`tried to update oldRow=`, oldRow, ` with newRow=`, row);
        throw new Error("Can't insert, row already exists!");
    }
    console.log(`Inserting row`, row);
    table.rows.push({...row});
};