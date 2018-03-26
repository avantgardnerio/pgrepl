import fs from 'fs';

import { db } from './DbService.mjs';

const GET_SCHEMA = fs.readFileSync(`./queries/getSchema.sql`, `utf8`);

class SnapshotService {
    async takeSnapshot(primaryTableName, pk) {
        const results = await db.multi(GET_SCHEMA);
        const schema = results[0];
        const relations = results[1];
        const tableNames = [...new Set(schema.map(t => t.tableName))];
        const tables = tableNames.map(tableName => {
            const columns = schema.filter(it => it.tableName === tableName);
            columns.sort((a, b) => a.ordinalPosition < b.ordinalPosition);
            const rows = [];
            return { name: tableName, columns, rows };
        });
        const foreignTableNames = [...new Set(relations.map(r => r.foreignTable))];
        const foreignColumnNames = foreignTableNames.map(ftn => {
            return {
                tableName: ftn,
                columns: relations.filter(rel => rel.foreignTable === ftn)
            }
        });
        const lsn = await this.getCurrentLSN();
        if (primaryTableName && pk) {
            for (const table of tables) {
                if(!foreignTableNames.includes(table.name)) continue;
                const colNames = table.columns.map(it => it.columnName);
                const fks = foreignColumnNames[table.name];
                table.rows = await this.select(table.name, colNames, fks, pk);
            }
            const table = tables.find(t => t.name === primaryTableName);
            const colNames = table.columns.map(it => it.columnName);
            const pkCols = schema.filter(col => col.tableName === table.name && col.pkOrdinal);
            table.rows = await this.select(table.name, colNames, pkCols, pk);
        }
        return { lsn, tables };
    }

    async select(tableName, columns, keys, values) {
        const clause = keys.map(k => `"${k}"=?`).join(` and `);
        const colNames = columns.map(name => `"${name}"`).join(`,`);
        const sql = `select ${colNames} from "${tableName}" where ${clause}`;
        const rows = await db.any(sql, values);
        return rows
    }

    async selectAll(tableName, columns) {
        const colNames = columns.map(name => `"${name}"`).join(`,`);
        const sql = `select ${colNames} from "${tableName}"`;
        const rows = await db.any(sql);
        return rows
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