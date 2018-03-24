const LogicalReplication = require('pg-logical-replication');
const {Client} = require('pg');

//Connection parameter : https://github.com/brianc/node-postgres/wiki/Client#parameters
const connInfo = {
    user: 'postgres',
    host: '127.0.0.1',
    database: 'pgrepl_test',
    password: 'postgres',
    port: 5432,
};
const POLL_INTERVAL = 250;

class ReplService {

    constructor() {
        this.lastLsn = undefined;
    }

    connect() {
        this.stream = new LogicalReplication(connInfo);
        this.stream.on('data', (msg) => this.onMsg(msg));
        this.stream.on('error', (err) => this.onError(err));
        this.poll();
    }

    poll() {
        this.stream.getChanges('test_slot', this.lastLsn, {includeXids: true}, (e) => this.onError(e));
    }

    onMsg(msg) {
        try {
            this.lastLsn = msg.lsn || this.lastLsn;
            const str = (msg.log || '').toString('utf8');
            const obj = JSON.parse(str);
            console.log(JSON.stringify(obj, null, 2));
            //TODO: DO SOMETHING. eg) replicate to other dbms(pgsql, mysql, ...)
        } catch (e) {
            console.error(`Error processing message!`, e);
        }
        setTimeout(() => this.poll(), POLL_INTERVAL);
    };

    onError(err) {
        setTimeout(() => this.poll(), POLL_INTERVAL);
        if (!err) return;
        console.error('Logical replication initialize error', err);
    }

    async createSlot() {
        const client = new Client(connInfo);
        await client.connect();
        await client.query(`SELECT * FROM pg_create_logical_replication_slot('test_slot', 'wal2json');`);
        await client.end()
    }

    async dropSlot() {
        const client = new Client(connInfo);
        await client.connect();
        await client.query(`SELECT * FROM pg_create_logical_replication_slot('test_slot', 'wal2json');`);
        await client.end()
    }

}
