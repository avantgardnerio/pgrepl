export default class Database {
    constructor(name) {
        this.name = name;
        this.version = 0;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.name, 1);
            req.onerror = (ev) => reject(req.errorCode);
            req.onsuccess = (ev) => {
                this.db = ev.target.result;
                resolve(this.version);
            };
            req.onupgradeneeded = (ev) => {
                this.version = ev.newVersion;
            };
        });
    }
}