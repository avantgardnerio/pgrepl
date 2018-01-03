import createReducer from './index';
import {createInsertRowAction, createTxnAction} from "../actions/database";

const disconnectedNoData = {
    tables: {
        person: {
            columns: [{"name": "id", "type": "character varying", "pkOrdinal": 1}],
            rows: []
        },
        metadata: {
            rows: {id: 1, lsn: 0, xid: 0, csn: 0}
        }
    },
    log: [],
    lsn: 0,
    xid: 0,
    connected: false,
    cleared: false
};

describe(`the reducer`, () => {
    it(`should allow insert while offline`, () => {
        // Setup
        const state = disconnectedNoData;
        const person = {
            id: "79cd28e5-b6e4-42a6-9da6-b605a701e1de",
            firstName: "Alan",
            lastName: "Turing",
        };
        const change = createInsertRowAction("person", person);
        const action = createTxnAction([change]);
        const expected = JSON.parse(JSON.stringify(state));
        expected.tables['person'].rows.push({...person, curTxnId: action.txn.id});
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

    it(`should allow insert while online`, () => {
        const state = {
            "tables": {
                "person": {
                    "rows": [{
                        "id": "20d00f70-1fc6-41cf-bf4a-3a7521fa6d0c",
                        "firstName": "Alan",
                        "lastName": "Turing",
                        "curTxnId": "79f17574-180d-41e3-9e0f-a394e37e2846"
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "firstName", "type": "character varying"},
                        {"name": "lastName", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]}
            },
            "log": [{
                "id": "79f17574-180d-41e3-9e0f-a394e37e2846",
                "changes": [{
                    "type": "INSERT",
                    "table": "person",
                    "record": {
                        "id": "20d00f70-1fc6-41cf-bf4a-3a7521fa6d0c",
                        "firstName": "Alan",
                        "lastName": "Turing",
                        "curTxnId": "79f17574-180d-41e3-9e0f-a394e37e2846"
                    }
                }]
            }],
            "lsn": 1000,
            "xid": 0,
            "connected": true,
            "cleared": false
        };
        const action = {
            "type": "TXN",
            "payload": {
                "xid": 1234,
                "nextlsn": "0/363678B8",
                "timestamp": "2018-01-03 12:19:30.136103-05",
                "clientTxnId": "90489467-8c5d-47a4-9ebf-ac71b9d4af7d",
                "lsn": 1001,
                "change": [{
                    "kind": "insert",
                    "table": "person",
                    "columnnames": ["id", "cx", "cy", "r", "strokeWidth", "stroke", "fill", "curTxnId", "prvTxnId"],
                    "columnvalues": ["0b026dbb-eebc-4a03-a4e5-f7aa5c8c91bf", 286, 195, 40, 4, "green", "yellow", "90489467-8c5d-47a4-9ebf-ac71b9d4af7d", null]
                }]
            }
        };
        const expected = {
            "tables": {
                "circles": {
                    "rows": [{
                        "id": "20d00f70-1fc6-41cf-bf4a-3a7521fa6d0c",
                        "cx": 221,
                        "cy": 195,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": 4,
                        "fill": "yellow",
                        "curTxnId": "79f17574-180d-41e3-9e0f-a394e37e2846"
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]}
            },
            "log": [],
            "lsn": 909538808,
            "xid": 18693,
            "connected": true,
            "cleared": false
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

    it(`should allow delete while offline`, () => {
        const state = {
            "tables": {
                "circles": {
                    "rows": [{
                        "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                        "cx": 186,
                        "cy": 180,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "51c1176b-b026-45c4-a5b6-710c452380be",
                        "prvTxnId": null
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            }, "log": [], "lsn": 876133360, "xid": 17547, "connected": false, "cleared": false
        };
        const action = {
            "type": "COMMIT",
            "txn": {
                "id": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                "changes": [{
                    "type": "DELETE",
                    "table": "circles",
                    "record": {
                        "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                        "cx": 186,
                        "cy": 180,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                        "prvTxnId": "51c1176b-b026-45c4-a5b6-710c452380be"
                    },
                    "prior": {
                        "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                        "cx": 186,
                        "cy": 180,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "51c1176b-b026-45c4-a5b6-710c452380be",
                        "prvTxnId": null
                    }
                }]
            }
        };
        const expected = {
            "tables": {
                "circles": {
                    "rows": [],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            }, "log": [
                {
                    "id": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                    "changes": [{
                        "type": "DELETE",
                        "table": "circles",
                        "record": {
                            "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                            "cx": 186,
                            "cy": 180,
                            "r": 40,
                            "stroke": "green",
                            "strokeWidth": "4",
                            "fill": "yellow",
                            "curTxnId": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                            "prvTxnId": "51c1176b-b026-45c4-a5b6-710c452380be"
                        },
                        "prior": {
                            "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                            "cx": 186,
                            "cy": 180,
                            "r": 40,
                            "stroke": "green",
                            "strokeWidth": "4",
                            "fill": "yellow",
                            "curTxnId": "51c1176b-b026-45c4-a5b6-710c452380be",
                            "prvTxnId": null
                        }
                    }]
                }
            ]
            , "lsn": 876133360, "xid": 17547, "connected": false, "cleared": false
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

    it(`should allow move while offline`, () => {
        const state = {
            "tables": {
                "circles": {
                    "rows": [{
                        "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                        "cx": 186,
                        "cy": 180,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "51c1176b-b026-45c4-a5b6-710c452380be",
                        "prvTxnId": null
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            }, "log": [], "lsn": 876236279, "xid": 0, "connected": true, "cleared": false
        };
        const action = {
            "type": "COMMIT",
            "txn": {
                "id": "fe6a96cc-4c6f-424f-acdc-67ae789ff830",
                "changes": [
                    {
                        "type": "UPDATE",
                        "table": "circles",
                        "record": {
                            "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                            "cx": 174,
                            "cy": 264,
                            "r": 40,
                            "stroke": "green",
                            "strokeWidth": "4",
                            "fill": "yellow",
                            "curTxnId": "fe6a96cc-4c6f-424f-acdc-67ae789ff830",
                            "prvTxnId": "51c1176b-b026-45c4-a5b6-710c452380be"
                        },
                        "prior": {
                            "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                            "cx": 186,
                            "cy": 180,
                            "r": 40,
                            "stroke": "green",
                            "strokeWidth": "4",
                            "fill": "yellow",
                            "curTxnId": "51c1176b-b026-45c4-a5b6-710c452380be",
                            "prvTxnId": null
                        }
                    }
                ]
            }
        };
        const expected = {
            "tables": {
                "circles": {
                    "rows": [
                        {
                            "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                            "cx": 174,
                            "cy": 264,
                            "r": 40,
                            "stroke": "green",
                            "strokeWidth": "4",
                            "fill": "yellow",
                            "curTxnId": "fe6a96cc-4c6f-424f-acdc-67ae789ff830",
                            "prvTxnId": "51c1176b-b026-45c4-a5b6-710c452380be"
                        }
                    ],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [
                {
                    "id": "fe6a96cc-4c6f-424f-acdc-67ae789ff830",
                    "changes": [
                        {
                            "type": "UPDATE",
                            "table": "circles",
                            "record": {
                                "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                                "cx": 174,
                                "cy": 264,
                                "r": 40,
                                "stroke": "green",
                                "strokeWidth": "4",
                                "fill": "yellow",
                                "curTxnId": "fe6a96cc-4c6f-424f-acdc-67ae789ff830",
                                "prvTxnId": "51c1176b-b026-45c4-a5b6-710c452380be"
                            },
                            "prior": {
                                "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                                "cx": 186,
                                "cy": 180,
                                "r": 40,
                                "stroke": "green",
                                "strokeWidth": "4",
                                "fill": "yellow",
                                "curTxnId": "51c1176b-b026-45c4-a5b6-710c452380be",
                                "prvTxnId": null
                            }
                        }
                    ]
                }
            ],
            "lsn": 876236279, "xid": 0, "connected": true, "cleared": false
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

    it(`should allow move while online`, () => {
        const state = {
            "tables": {
                "circles": {
                    "rows": [{
                        "id": "52f50f04-cf7b-4d53-a3f2-60a81718545d",
                        "cx": 189,
                        "cy": 270,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "52b623b9-aaf8-44a9-bb73-f134d9522fb4",
                        "prvTxnId": "e8215147-8b28-4ed5-baca-256bdbf60a17"
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [{
                "id": "52b623b9-aaf8-44a9-bb73-f134d9522fb4",
                "changes": [{
                    "type": "UPDATE",
                    "table": "circles",
                    "record": {
                        "id": "52f50f04-cf7b-4d53-a3f2-60a81718545d",
                        "cx": 189,
                        "cy": 270,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "52b623b9-aaf8-44a9-bb73-f134d9522fb4",
                        "prvTxnId": "e8215147-8b28-4ed5-baca-256bdbf60a17"
                    },
                    "prior": {
                        "id": "52f50f04-cf7b-4d53-a3f2-60a81718545d",
                        "cx": 226,
                        "cy": 201,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "e8215147-8b28-4ed5-baca-256bdbf60a17",
                        "prvTxnId": null
                    }
                }]
            }],
            "lsn": 876915288,
            "xid": 17567,
            "connected": true,
            "cleared": false
        };
        const action = {
            "type": "TXN",
            "payload": {
                "xid": 17568,
                "nextlsn": "0/3444F230",
                "timestamp": "2018-01-02 14:12:29.680481-05",
                "clientTxnId": "52b623b9-aaf8-44a9-bb73-f134d9522fb4",
                "lsn": 876933136,
                "change": [{
                    "kind": "update",
                    "table": "circles",
                    "columnnames": ["id", "cx", "cy", "r", "stroke", "strokeWidth", "fill", "curTxnId", "prvTxnId"],
                    "columnvalues": ["52f50f04-cf7b-4d53-a3f2-60a81718545d", 189, 270, 40, "green", "4", "yellow", "52b623b9-aaf8-44a9-bb73-f134d9522fb4", "e8215147-8b28-4ed5-baca-256bdbf60a17"],
                    "oldkeys": {
                        "keynames": ["id", "cx", "cy", "r", "stroke", "strokeWidth", "fill", "curTxnId"],
                        "keyvalues": ["52f50f04-cf7b-4d53-a3f2-60a81718545d", 226, 201, 40, "green", "4", "yellow", "e8215147-8b28-4ed5-baca-256bdbf60a17"]
                    }
                }]
            }
        };
        const expected = {
            "tables": {
                "circles": {
                    "rows": [
                        {
                            "id": "52f50f04-cf7b-4d53-a3f2-60a81718545d",
                            "cx": 189,
                            "cy": 270,
                            "r": 40,
                            "stroke": "green",
                            "strokeWidth": "4",
                            "fill": "yellow",
                            "curTxnId": "52b623b9-aaf8-44a9-bb73-f134d9522fb4",
                            "prvTxnId": "e8215147-8b28-4ed5-baca-256bdbf60a17"
                        }
                    ],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [],
            "lsn": 876933136,
            "xid": 17568,
            "connected": true,
            "cleared": false
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

    it(`should ignore transactions that have already been processed`, () => {
        const state = {
            "tables": {
                "circles": {
                    "rows": [],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [{
                "id": "775bbec5-a8f6-4eff-af8a-38a813a4adfd",
                "changes": [{
                    "type": "DELETE",
                    "table": "circles",
                    "record": {
                        "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                        "cx": 219,
                        "cy": 160,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "775bbec5-a8f6-4eff-af8a-38a813a4adfd",
                        "prvTxnId": "4a550c8a-628d-49a4-bf79-3380d35f960d"
                    },
                    "prior": {
                        "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                        "cx": 219,
                        "cy": 160,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "4a550c8a-628d-49a4-bf79-3380d35f960d",
                        "prvTxnId": null
                    }
                }]
            }],
            "lsn": 877581296,
            "xid": 17587,
            "connected": true,
            "cleared": false
        };
        const action = {
            "type": "TXN",
            "payload": {
                "xid": 17587,
                "nextlsn": "0/344ED670",
                "timestamp": "2018-01-02 14:22:38.606025-05",
                "clientTxnId": "4a550c8a-628d-49a4-bf79-3380d35f960d",
                "lsn": 877581296,
                "change": [{
                    "kind": "insert",
                    "table": "circles",
                    "columnnames": ["id", "cx", "cy", "r", "stroke", "strokeWidth", "fill", "curTxnId", "prvTxnId"],
                    "columnvalues": ["36a4fada-660f-4649-803a-b2fc6fedc292", 219, 160, 40, "green", "4", "yellow", "4a550c8a-628d-49a4-bf79-3380d35f960d", null]
                }, {
                    "kind": "insert",
                    "table": "txnIdMap",
                    "columnnames": ["xid", "clientTxnId"],
                    "columnvalues": [17587, "4a550c8a-628d-49a4-bf79-3380d35f960d"]
                }]
            }
        };
    });

    it(`should revert commits that conflict with transactions from the server`, () => {
        const state = {
            "tables": {
                "circles": {
                    "rows": [],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [{
                "id": "775bbec5-a8f6-4eff-af8a-38a813a4adfd",
                "changes": [{
                    "type": "DELETE",
                    "table": "circles",
                    "record": {
                        "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                        "cx": 219,
                        "cy": 160,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "775bbec5-a8f6-4eff-af8a-38a813a4adfd",
                        "prvTxnId": "4a550c8a-628d-49a4-bf79-3380d35f960d"
                    },
                    "prior": {
                        "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                        "cx": 219,
                        "cy": 160,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": "4",
                        "fill": "yellow",
                        "curTxnId": "4a550c8a-628d-49a4-bf79-3380d35f960d",
                        "prvTxnId": null
                    }
                }]
            }],
            "lsn": 877581296,
            "xid": 17587,
            "connected": true,
            "cleared": false
        };
        const action = {
            "type": "TXN",
            "payload": {
                "xid": 17588,
                "nextlsn": "0/344F5D08",
                "timestamp": "2018-01-02 14:22:52.058679-05",
                "clientTxnId": "d875109a-cae4-4b25-b245-ad00e03e77bb",
                "lsn": 877615848,
                "change": [{
                    "kind": "update",
                    "table": "circles",
                    "columnnames": ["id", "cx", "cy", "r", "stroke", "strokeWidth", "fill", "curTxnId", "prvTxnId"],
                    "columnvalues": ["36a4fada-660f-4649-803a-b2fc6fedc292", 181, 218, 40, "green", "4", "yellow", "d875109a-cae4-4b25-b245-ad00e03e77bb", "4a550c8a-628d-49a4-bf79-3380d35f960d"],
                    "oldkeys": {
                        "keynames": ["id", "cx", "cy", "r", "stroke", "strokeWidth", "fill", "curTxnId"],
                        "keyvalues": ["36a4fada-660f-4649-803a-b2fc6fedc292", 219, 160, 40, "green", "4", "yellow", "4a550c8a-628d-49a4-bf79-3380d35f960d"]
                    }
                }]
            }
        };
        const expected = {
            "tables": {
                "circles": {
                    "rows": [
                        {
                            "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                            "cx": 181,
                            "cy": 218,
                            "r": 40,
                            "stroke": "green",
                            "strokeWidth": "4",
                            "fill": "yellow",
                            "curTxnId": "d875109a-cae4-4b25-b245-ad00e03e77bb",
                            "prvTxnId": "4a550c8a-628d-49a4-bf79-3380d35f960d"
                        }
                    ],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokeWidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curTxnId", "type": "character varying"},
                        {"name": "prvTxnId", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [],
            "lsn": 877615848,
            "xid": 17588,
            "connected": true,
            "cleared": false
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
                "circles": {"rows": []},
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
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
                                "data": [ // TODO: convert to JSON friendly format on server
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
                        "rows": [
                            {
                                "id": "d2ea6203-8228-4da4-9cc2-69f66b27704d",
                                "curTxnId": "f8ccc378-cf4f-487a-b6f4-90020430f1b8",
                                "prvTxnId": null, // TODO: null -> undefined
                                "firstName": "Alan",
                                "lastName": "Turing",
                            }
                        ]
                    },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
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