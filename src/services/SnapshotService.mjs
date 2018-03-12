import fs from 'fs';

import { db } from './DbService.mjs';

const GET_SCHEMA = fs.readFileSync(`./queries/getSchema.sql`, `utf8`);

class SnapshotService {
    async takeSnapshot(includeRows) {
        const schema = await db.any(GET_SCHEMA);
        const tableNames = [...new Set(schema.map(t => t.tableName))];
        const tables = tableNames.map(tableName => {
            const columns = schema.filter(it => it.tableName === tableName);
            columns.sort((a, b) => a.ordinalPosition < b.ordinalPosition);
            const rows = [];
            return { name: tableName, columns, rows };
        });
        if (includeRows) {
            for (const table of tables) {
                const colNames = table.columns.map(it => it.columnName);
                table.rows = await this.selectAll(table.name, colNames);
            }
        }
        const lsn = await this.getCurrentLSN();
        return { lsn, tables };
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