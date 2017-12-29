import {range} from "lodash";

const migrations = [
    (db) => { // v1: system data
        db.createObjectStore('txnLog', {keyPath: 'id'});
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
        const md = {id: 1, lsn: 0, xid: 0};
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

    // --------------------------------------- transactions -----------------------------------------------------------
    saveTxn(txn) {
        return new Promise((resolve, reject) => {

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