import createReducer from './replicationReducer';
import {
    createDeleteRowAction,
    createInsertRowAction,
    createTxnAction,
    createUpdateRowAction
} from "../actions/database";

const disconnectedNoData = {
    tables: {
        person: {
            columns: [{"name": "id", "type": "character varying", "pkOrdinal": 1}],
            rows: {}
        },
        metadata: {
            rows: {
                "1": {id: 1, lsn: 0, xid: 0, csn: 0}
            }
        }
    },
    log: [],
    lsn: 0,
    xid: 0,
    connected: false,
    cleared: false
};

const alan = {
    id: "79cd28e5-b6e4-42a6-9da6-b605a701e1de",
    firstName: "Alan",
    lastName: "Turing",
};

describe(`the reducer`, () => {
    it(`should allow INSERT while offline`, () => {
        // Setup
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        const change = createInsertRowAction("person", alan);
        const action = createTxnAction([change]);
        const expected = JSON.parse(JSON.stringify(state));
        expected.tables['person'].rows[alan.id] = {...alan, curTxnId: action.txn.id};
        expected.log.push(action.txn);
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);

        // Exercise
        const actual = reducer(state, action);

        // Assert
        expect(actual).toEqual(expected);
    });

    it('should allow multiple inserts while offline', () => {
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = false;
        const change = createInsertRowAction("person", alan);
        const action1 = createTxnAction([change]);
        const prior = {...alan, curTxnId: action1.txn.id};
        state.tables['person'].rows[prior.id] = prior;
        state.log.push(action1.txn);

        const post = {
            id: "3fdeb1cb-084e-4db3-95da-932ca7045c2f",
            firstName: "Alan",
            lastName: "Kay",
            curTxnId: "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
        };
        const action2 = {
            "type": "COMMIT",
            "txn": {
                "id": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                "changes": [{
                    "type": "INSERT",
                    "table": "person",
                    "record": post,
                }]
            }
        };
        const expected = {
            "tables": {
                "person": {
                    "rows": {
                        [prior.id]: prior,
                        [post.id]: post
                    },
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                },
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}},
            },
            "log": [action1.txn, action2.txn],
            "lsn": 0, "xid": 0, "connected": false, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action2);
        expect(actual).toEqual(expected);
    });

    it(`should allow INSERT while online`, () => {
        const person = {...alan, "curTxnId": "79f17574-180d-41e3-9e0f-a394e37e2846"};
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = true;
        state.lsn = 1000;
        state.tables['person'].rows[person.id] = person;
        const change = createInsertRowAction("person", alan);
        const txnAction = createTxnAction([change]);
        state.log.push(txnAction.txn);

        const action = {
            "type": "TXN",
            "payload": {
                "xid": 1234, "id": txnAction.txn.id, "lsn": 1001,
                "changes": [{"type": "INSERT", "table": "person", "record": person}]
            }
        };
        const expected = {
            "tables": {
                "person": {
                    "rows": {[alan.id]: {...alan, "curTxnId": "79f17574-180d-41e3-9e0f-a394e37e2846"}},
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                },
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}}
            },
            "log": [], "lsn": 1001, "xid": 1234, "connected": true, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it(`should allow DELETE while offline`, () => {
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = false;
        state.xid = 1234;
        state.lsn = 1000;
        const prior = {...alan, "curTxnId": "79f17574-180d-41e3-9e0f-a394e37e2846"};
        state.tables['person'].rows[prior.id] = prior;

        const post = {
            ...prior,
            curTxnId: "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
            prvTxnId: prior.curTxnId
        };
        const action = {
            "type": "COMMIT",
            "txn": {
                "id": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                "changes": [{
                    "type": "DELETE",
                    "table": "person",
                    "record": post,
                    "prior": prior
                }]
            }
        };
        const expected = {
            "tables": {
                "person": {"rows": {}, "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]},
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}},
            }, "log": [action.txn], "lsn": 1000, "xid": 1234, "connected": false, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it(`should allow DELETE while online`, () => {
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = true;
        state.lsn = 1000;
        const prior = {
            ...alan,
            curTxnId: "79f17574-180d-41e3-9e0f-a394e37e2846",
        };
        const post = {
            ...prior,
            curTxnId: "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
            prvTxnId: prior.curTxnId
        };
        const change = createDeleteRowAction("person", post);
        const txnAction = createTxnAction([change]);
        state.log.push(txnAction.txn);

        const action = {
            "type": "TXN",
            "payload": {
                "xid": 1234,
                "id": txnAction.txn.id,
                "lsn": 1001,
                "changes": [{
                    "type": "DELETE",
                    "table": "person",
                    record: post
                }]
            }
        };
        const expected = {
            "tables": {
                "person": {
                    "rows": {},
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                },
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}}
            },
            "log": [], "lsn": 1001, "xid": 1234, "connected": true, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it(`should allow UPDATE while offline`, () => {
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = false;
        state.xid = 1234;
        state.lsn = 1000;
        const prior = {...alan, "curTxnId": "79f17574-180d-41e3-9e0f-a394e37e2846"};
        state.tables['person'].rows[prior.id] = prior;

        const post = {
            ...prior,
            lastName: "Kay",
            curTxnId: "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
            prvTxnId: prior.curTxnId
        };
        const action = {
            "type": "COMMIT",
            "txn": {
                "id": "fe6a96cc-4c6f-424f-acdc-67ae789ff830",
                "changes": [
                    {
                        "type": "UPDATE",
                        "table": "person",
                        "record": post,
                        "prior": prior
                    }
                ]
            }
        };
        const expected = JSON.parse(JSON.stringify(state));
        expected.tables['person'].rows[post.id] = post;
        expected.log.push(action.txn);

        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it(`should allow UPDATE while online`, () => {
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = true;
        state.lsn = 1000;
        const prior = {
            ...alan,
            curTxnId: "79f17574-180d-41e3-9e0f-a394e37e2846",
        };
        const post = {
            ...prior,
            lastName: "Kay",
            curTxnId: "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
            prvTxnId: prior.curTxnId
        };
        state.tables['person'].rows[prior.id] = prior;
        const change = createUpdateRowAction("person", alan, state);
        const txnAction = createTxnAction([change]);
        state.log.push(txnAction.txn);

        const action = {
            "type": "TXN",
            "payload": {
                "xid": 1234,
                "id": "52b623b9-aaf8-44a9-bb73-f134d9522fb4",
                "lsn": 1001,
                "changes": [{
                    "type": "UPDATE",
                    "table": "person",
                    record: post,
                    prior
                }]
            }
        };
        const expected = {
            "tables": {
                "person": {
                    "rows": {[post.id]: post},
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                },
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}}
            },
            "log": [], "lsn": 1001, "xid": 1234, "connected": true, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it(`should revert conflicting deletes`, () => {
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = true;
        state.lsn = 1000;
        const prior = {
            ...alan,
            curTxnId: "79f17574-180d-41e3-9e0f-a394e37e2846",
        };
        const post = {
            ...prior,
            lastName: 'Kay',
            curTxnId: "d875109a-cae4-4b25-b245-ad00e03e77bb",
            prvTxnId: prior.curTxnId
        };
        state.tables['person'].rows[post.id] = post;
        const change = createUpdateRowAction("person", post, state);
        const txnAction = createTxnAction([change]);
        state.log.push(txnAction.txn);

        const action = {
            "type": "TXN",
            "payload": {
                "id": "d875109a-cae4-4b25-b245-ad00e03e77bb",
                "xid": 1234,
                "lsn": 1001,
                "changes": [{
                    "type": "DELETE",
                    "table": "person",
                    record: post
                }]
            }
        };
        const expected = {
            "tables": {
                "person": {
                    "rows": {},
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                },
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}}
            },
            "log": [], "lsn": 1001, "xid": 1234, "connected": true, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it(`should revert conflicting updates`, () => {
        const state = JSON.parse(JSON.stringify(disconnectedNoData));
        state.connected = true;
        state.lsn = 1000;
        const prior = {
            ...alan,
            curTxnId: "79f17574-180d-41e3-9e0f-a394e37e2846",
        };
        const post = {
            ...prior,
            lastName: 'Kay',
            curTxnId: "d875109a-cae4-4b25-b245-ad00e03e77bb",
            prvTxnId: prior.curTxnId
        };
        state.tables['person'].rows[prior.id] = prior;
        const change = createDeleteRowAction("person", prior, state);
        const txnAction = createTxnAction([change]);
        delete state.tables['person'].rows[prior.id];
        state.log.push(txnAction.txn);

        const action = {
            "type": "TXN",
            "payload": {
                "id": "d875109a-cae4-4b25-b245-ad00e03e77bb",
                "xid": 1234,
                "lsn": 1001,
                "changes": [{
                    "type": "UPDATE",
                    "table": "person",
                    record: post,
                    prior
                }]
            }
        };
        const expected = {
            "tables": {
                "person": {
                    "rows": {[post.id]: post},
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                },
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}}
            },
            "log": [], "lsn": 1001, "xid": 1234, "connected": true, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        let txnId = undefined;
        let t = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot,
            removeFromLog: async (clientTxnId) => txnId = clientTxnId,
            saveTxn: async (txn, state) => t = txn
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it('should be able to connect to server', () => {
        const state = {"connected": false};
        const action = {"type": "CONNECTED"};
        const expected = {"connected": true};
        const initialState = {lsn: 0};
        const reducer = createReducer(initialState);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it('should handle disconnects', () => {
        const state = {"connected": true};
        const action = {"type": "DISCONNECTED"};
        const expected = {"connected": false};
        const initialState = {lsn: 0};
        const reducer = createReducer(initialState);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it('should apply snapshots from server', () => {
        const state = {
            "tables": {
                "circles": {"rows": {}},
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}},
            }, "log": [], "lsn": 0, "xid": 0, "connected": true, "cleared": false
        };
        const action = {
            "type": "SNAPSHOT_RESPONSE",
            "payload": {
                "lsn": 1000,
                "tables": [
                    {
                        "name": "circles",
                        "columns": [
                            {"name": "id", "type": "character varying", "pkOrdinal": 1},
                            {"name": "curTxnId", "type": "character varying"},
                            {"name": "prvTxnId", "type": "character varying"},
                            {"name": "firstName", "type": "character varying"},
                            {"name": "lastName", "type": "character varying"},
                        ],
                        "rows": [
                            {
                                "data": [
                                    "d2ea6203-8228-4da4-9cc2-69f66b27704d",
                                    "f8ccc378-cf4f-487a-b6f4-90020430f1b8",
                                    null,
                                    "Alan",
                                    "Turing",
                                ]
                            }
                        ]
                    },
                ]
            }
        };
        const expected = {
            "tables": {
                "circles":
                    {
                        "columns": [
                            {"name": "id", "type": "character varying", "pkOrdinal": 1},
                            {"name": "curTxnId", "type": "character varying"},
                            {"name": "prvTxnId", "type": "character varying"},
                            {"name": "firstName", "type": "character varying"},
                            {"name": "lastName", "type": "character varying"},
                        ],
                        "rows": {
                            "d2ea6203-8228-4da4-9cc2-69f66b27704d": {
                                "id": "d2ea6203-8228-4da4-9cc2-69f66b27704d",
                                "curTxnId": "f8ccc378-cf4f-487a-b6f4-90020430f1b8",
                                "prvTxnId": null, // TODO: null -> undefined
                                "firstName": "Alan",
                                "lastName": "Turing",
                            }
                        }
                    },
                "metadata": {"rows": {"1": {"id": 1, "lsn": 0, "xid": 0, "csn": 0}}},
            }, "log": [], "lsn": 1000, "xid": 0, "connected": true, "cleared": false
        };
        const initialState = {lsn: 0};
        let md = undefined;
        let ss = undefined;
        const db = {
            getMetadata: async () => ({"lsn": 0}),
            setMetadata: async (metadata) => md = metadata,
            saveSnapshot: async (snapshot) => ss = snapshot
        };
        const reducer = createReducer(initialState, db);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
        // TODO: async testing
        // expect(md).toEqual({});
        // expect(ss).toEqual({});
    })
});