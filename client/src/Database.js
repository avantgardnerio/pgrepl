const migrations = [
    (db) => { // v1: system data
        db.createObjectStore('txnLog', {keyPath: 'id'});
        db.createObjectStore('metadata', {keyPath: 'id'});
    },
    (db) => { // v2: app data
        db.createObjectStore('circles', {keyPath: 'id'});
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
            txn.objectStore('metadata').add(metadata);
        })
    }
}