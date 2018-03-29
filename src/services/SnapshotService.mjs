import fs from 'fs';

import { db } from './DbService.mjs';

const GET_SCHEMA = fs.readFileSync(`./queries/getSchema.sql`, `utf8`);

class SnapshotService {
    async takeSnapshot(primaryTableName, pk) {
        const [columns, relations] = await db.multi(GET_SCHEMA);
        const tableNames = [...new Set(columns.map(t => t.tableName))];
        const tables = tableNames.map(tableName => {
            const cols = columns.filter(col => col.tableName === tableName);
            cols.sort((a, b) => a.ordinalPosition < b.ordinalPosition);
            return { name: tableName, columns: cols, rows: [] };
        });
        const lsn = await this.getCurrentLSN();
        if (primaryTableName && pk) {
            const primaryTable = tables.find(t => t.name === primaryTableName);
            const constraintNames = [...new Set(relations.map(r => r.constraint))];
            for(const constraintName of constraintNames) {
                const fkCols = relations.filter(r => r.constraint === constraintName);
                const fkColNames = fkCols.map(c => c.foreignColumn);
                const foreignTableName = fkCols[0].foreignTable;
                const foreignTable = tables.find(t => t.name === foreignTableName);
                const colNames = foreignTable.columns.map(it => it.columnName);
                const results = await this.select(foreignTable.name, colNames, fkColNames, pk);
                foreignTable.rows.push(...results);
            }
            const pkCols = columns
                .filter(col => col.tableName === primaryTable.name && col.pkOrdinal)
                .map(col => col.columnName);
            const colNames = columns
                .filter(col => col.tableName === primaryTable.name)
                .map(col => col.columnName);
            primaryTable.rows = await this.select(primaryTable.name, colNames, pkCols, pk);
        }
        return { lsn, tables };
    }

    async select(tableName, columns, keys, values) {
        const clause = keys.map(k => `"${k}"=$1`).join(` and `);
        const colNames = columns.map(name => `"${name}"`).join(`,`);
        const sql = `select ${colNames} from "${tableName}" where ${clause}`;
        const rows = await db.any(sql, ...values);
        return rows;
    }

    async selectAll(tableName, columns) {
        const colNames = columns.map(name => `"${name}"`).join(`,`);
        const sql = `select ${colNames} from "${tableName}"`;
        const rows = await db.any(sql);
        return rows;
    }

    async getVersion() {
        if (this.version) return this.version;
        const text = (await db.one(`SELECT version();`)).version;
        const group = /PostgreSQL\s([0-9]*)/g.exec(text)[1];
        this.version = parseInt(group, 10);
        return this.version;
    }

    async getCurrentLSN() {
        const func = (await this.getVersion()) >= 10 ? `pg_current_wal_lsn` : `pg_current_xlog_location`;
        const lsn = (await db.one(`SELECT ${func}()`))[func];
        return lsn;
    }
}

export default new SnapshotService();