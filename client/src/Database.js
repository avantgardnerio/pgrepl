import {range} from "lodash";
import {unique} from "./util/math";
import {getPk} from "./util/db";

const migrations = [
    (db) => { // v1: system data
        db.createObjectStore('txnLog', {keyPath: 'csn'});
        db.createObjectStore('txn_id_map', {keyPath: 'xid'});
        db.createObjectStore('metadata', {keyPath: 'id'});
    },
    (db) => { // v2: app data
        db.createObjectStore('circles', {keyPath: 'id'});
        db.createObjectStore('person', {keyPath: 'id'});
    }
];

export default class Database {
    constructor(name) {
        this.name = name;
        this.version = 0;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.name, migrations.length);
            req.onerror = (ev) => reject(req.errorCode);
            req.onsuccess = (ev) => {
                console.log('Database ready!');
                this.db = ev.target.result;
                resolve(this.version);
            };
            req.onupgradeneeded = (ev) => {
                const db = ev.target.result;
                migrations.forEach((migration, idx) => {
                    if (ev.oldVersion > idx) return;
                    if (ev.newVersion <= idx) return;
                    migration(db);
                });
                this.version = ev.newVersion;
            };
        });
    }

    // --------------------------------------------- metadata ---------------------------------------------------------
    async getMetadataOrDefault() {
        const metadata = await this.getMetadata();
        console.log('metadata=', metadata);
        if (metadata) return metadata;
        const md = {id: 1, lsn: 0, xid: 0, csn: 0};
        await this.setMetadata(md);
        return md;
    }

    getMetadata() {
        return new Promise((resolve, reject) => {
            const txn = this.db.transaction(['metadata']);
            const store = txn.objectStore('metadata');
            const req = store.get(1);
            req.onerror = (ev) => reject(ev);
            req.onsuccess = (ev) => resolve(req.result);
        });
    }

    setMetadata(metadata) {
        return new Promise((resolve, reject) => {
            const txn = this.db.transaction(['metadata'], 'readwrite');
            txn.oncomplete = (ev) => resolve(ev);
            txn.onerror = (ev) => reject(ev);
            txn.objectStore('metadata').put(metadata);
        })
    }

    // ----------------------------------------- snapshots ------------------------------------------------------------
    saveSnapshot(snapshot) {
        return new Promise((resolve, reject) => {
            const tableNames = snapshot.tables.map(t => t.name);
            const txn = this.db.transaction(tableNames, 'readwrite');
            snapshot.tables.forEach(table => this.saveTable(txn, table));
            txn.oncomplete = (ev) => resolve(ev);
            txn.onerror = (ev) => reject(ev);
        });
    }

    saveTable(txn, table) {
        const colNames = table.columns.map(col => col.name);
        const objectStore = txn.objectStore(table.name);
        table.rows.forEach((values) => {
            const len = Math.min(colNames.length, values.data.length);
            const row = range(len)
                .reduce((acc, cur) => ({...acc, [colNames[cur]]: values.data[cur]}), {});
            objectStore.add(row);
        });
    }

    async getInitialState() {
        const metadata = await this.getMetadataOrDefault();
        const tables = await this.getTableData();
        const initialState = {
            tables,
            log: [],
            lsn: metadata.lsn,
            xid: metadata.xid,
            connected: false,
            cleared: false
        };
        return initialState;
    }

    getTableData() {
        return new Promise((resolve, reject) => {
            const tables = {};
            const tableNames = [...this.db.objectStoreNames];
            const txn = this.db.transaction(tableNames, 'readonly');
            txn.oncomplete = (ev) => resolve(tables);
            txn.onerror = (ev) => reject(ev);
            tableNames.forEach(tableName => {
                const table = {rows: []};
                const store = txn.objectStore(tableName);
                store.openCursor().onsuccess = (ev) => {
                    const cursor = ev.target.result;
                    if (cursor) {
                        table.rows.push(cursor.value);
                        cursor.continue();
                    }
                };
                tables[tableName] = table;
            });
        })
    }

    // --------------------------------------- transactions -----------------------------------------------------------
    saveTxn(transaction, db) {
        const changes = transaction.changes;
        return new Promise((resolve, reject) => {
            const tableNames = [...unique(changes.map(change => change.table)), 'metadata', 'txnLog'];
            const txn = this.db.transaction(tableNames, 'readwrite');
            txn.oncomplete = (ev) => resolve(ev);
            txn.onerror = (ev) => reject(ev);

            // rows
            for (let change of changes) {
                const tableName = change.table;
                const store = txn.objectStore(tableName);
                const table = db.tables[tableName];
                switch (change.type) {
                    case 'INSERT':
                        store.put(change.record);
                        break;
                    case 'UPDATE':
                        store.put(change.record);
                        break;
                    case 'DELETE':
                        const pk = getPk(change.record, table);
                        store.delete(pk);
                        break;
                    default:
                        throw new Error(`Unknown type: ${change.type}`);
                }
            }

            // log
            const req1 = txn.objectStore('metadata').get(1);
            req1.onerror = (ev) => reject(ev);
            req1.onsuccess = () => {
                const metadata = req1.result;
                metadata.csn++;
                const req2 = txn.objectStore('metadata').put(metadata);
                req2.onerror = (ev) => reject(ev);
                req2.onsuccess = () => {
                    txn.objectStore('txnLog').put({...transaction, csn: metadata.csn});
                };
            };
        });
    }

    // ----------------------------------------- helpers --------------------------------------------------------------
    clear() {
        return new Promise((resolve, reject) => {
            const tableNames = [...this.db.objectStoreNames];
            const txn = this.db.transaction(tableNames, 'readwrite');
            txn.oncomplete = (ev) => resolve(ev);
            txn.onerror = (ev) => reject(ev);
            tableNames.forEach(tableName => {
                const store = txn.objectStore(tableName);
                store.clear();
            });
        })
    }
}