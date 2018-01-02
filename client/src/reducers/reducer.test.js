import createReducer from './index';

describe(`the reducer`, () => {
    it(`should allow insert while offline`, () => {
        const expected = {
            "tables": {
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
                "person": {
                    "rows": [
                        {
                            "id": "79cd28e5-b6e4-42a6-9da6-b605a701e1de",
                            "curtxnid": "8a0adc15-651a-480d-85d4-8441ee042a5e",
                            "prevtxnid": undefined,
                            "firstName": "Alan",
                            "lastName": "Turing",
                        }
                    ]
                },
            },
            "log": [
                {
                    "id": "8a0adc15-651a-480d-85d4-8441ee042a5e",
                    "changes": [
                        {
                            "type": "INSERT",
                            "table": "person",
                            "record": {
                                "id": "79cd28e5-b6e4-42a6-9da6-b605a701e1de",
                                "curtxnid": "8a0adc15-651a-480d-85d4-8441ee042a5e",
                                "prevtxnid": undefined,
                                "firstName": "Alan",
                                "lastName": "Turing",
                            }
                        }
                    ]
                }
            ], "lsn": 0, "xid": 0, "connected": false, "cleared": false
        };
        const state = {
            "tables": {
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
                "person": {"rows": []},
            }, "log": [], "lsn": 0, "xid": 0, "connected": false, "cleared": false
        };
        const action = {
            "type": "COMMIT",
            "txn": {
                "id": "8a0adc15-651a-480d-85d4-8441ee042a5e",
                "changes": [
                    {
                        "type": "INSERT",
                        "table": "person",
                        "record": {
                            "id": "79cd28e5-b6e4-42a6-9da6-b605a701e1de",
                            "curtxnid": "8a0adc15-651a-480d-85d4-8441ee042a5e",
                            "prevtxnid": undefined,
                            "firstName": "Alan",
                            "lastName": "Turing",
                        }
                    }
                ]
            }
        };
        const initialState = {lsn: 0};
        const reducer = createReducer(initialState);
        const actual = reducer(state, action);
        expect(actual).toEqual(expected);
    });

    it(`should allow insert while online`, () => {
        const state = {
            "tables": {
                "circles": {
                    "rows": [{
                        "id": "3cbd788f-5a26-49aa-b389-e1e4aedacece",
                        "cx": 248,
                        "cy": 144,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": 4,
                        "fill": "yellow",
                        "curtxnid": "11f39b58-91cc-429a-a257-fc8ccb59415c"
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokewidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curtxnid", "type": "character varying"},
                        {"name": "prvtxnid", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [{
                "id": "11f39b58-91cc-429a-a257-fc8ccb59415c",
                "changes": [{
                    "type": "INSERT",
                    "table": "circles",
                    "record": {
                        "id": "3cbd788f-5a26-49aa-b389-e1e4aedacece",
                        "cx": 248,
                        "cy": 144,
                        "r": 40,
                        "stroke": "green",
                        "strokeWidth": 4,
                        "fill": "yellow",
                        "curtxnid": "11f39b58-91cc-429a-a257-fc8ccb59415c"
                    }
                }]
            }],
            "lsn": 875189679,
            "xid": 0,
            "connected": true,
            "cleared": false
        };
        const action = {
            "type": "TXN",
            "payload": {
                "xid": 17525,
                "nextlsn": "0/342A9AC0",
                "timestamp": "2018-01-02 12:02:47.403995-05",
                "clientTxnId": "11f39b58-91cc-429a-a257-fc8ccb59415c",
                "lsn": 875206720,
                "change": [
                    {
                        "kind": "insert",
                        "table": "circles",
                        "columnnames": ["id", "cx", "cy", "r", "stroke", "strokewidth", "fill", "curtxnid", "prvtxnid"],
                        "columnvalues": ["3cbd788f-5a26-49aa-b389-e1e4aedacece", 248, 144, 40, "green", "4", "yellow", "11f39b58-91cc-429a-a257-fc8ccb59415c", null]
                    }
                ]
            }
        };
        const expected = {
            "tables": {
                "circles": {
                    "rows": [{
                        "id": "3cbd788f-5a26-49aa-b389-e1e4aedacece",
                        "cx": 248,
                        "cy": 144,
                        "r": 40,
                        "stroke": "green",
                        "strokewidth": "4", // TODO: Fix casing issue
                        "fill": "yellow",
                        "curtxnid": "11f39b58-91cc-429a-a257-fc8ccb59415c",
                        "prvtxnid": null
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokewidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curtxnid", "type": "character varying"},
                        {"name": "prvtxnid", "type": "character varying"}
                    ]
                },
                "metadata": {"rows": [{"id": 1, "lsn": 0, "xid": 0, "csn": 0}]},
            },
            "log": [],
            "lsn": 875206720,
            "xid": 17525,
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
                        "strokewidth": "4",
                        "fill": "yellow",
                        "curtxnid": "51c1176b-b026-45c4-a5b6-710c452380be",
                        "prvtxnid": null
                    }],
                    "columns": [
                        {"name": "id", "type": "character varying", "pkOrdinal": 1},
                        {"name": "cx", "type": "integer"},
                        {"name": "cy", "type": "integer"},
                        {"name": "r", "type": "integer"},
                        {"name": "stroke", "type": "character varying"},
                        {"name": "strokewidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curtxnid", "type": "character varying"},
                        {"name": "prvtxnid", "type": "character varying"}
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
                        "strokewidth": "4",
                        "fill": "yellow",
                        "curtxnid": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                        "prvtxnid": "51c1176b-b026-45c4-a5b6-710c452380be"
                    },
                    "prior": {
                        "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                        "cx": 186,
                        "cy": 180,
                        "r": 40,
                        "stroke": "green",
                        "strokewidth": "4",
                        "fill": "yellow",
                        "curtxnid": "51c1176b-b026-45c4-a5b6-710c452380be",
                        "prvtxnid": null
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
                        {"name": "strokewidth", "type": "character varying"},
                        {"name": "fill", "type": "character varying"},
                        {"name": "curtxnid", "type": "character varying"},
                        {"name": "prvtxnid", "type": "character varying"}
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
                            "strokewidth": "4",
                            "fill": "yellow",
                            "curtxnid": "518e2c9d-2a32-48e4-bd1b-14c81f6b9b2a",
                            "prvtxnid": "51c1176b-b026-45c4-a5b6-710c452380be"
                        },
                        "prior": {
                            "id": "e5d431f4-dea9-43f4-897b-2997d85ed976",
                            "cx": 186,
                            "cy": 180,
                            "r": 40,
                            "stroke": "green",
                            "strokewidth": "4",
                            "fill": "yellow",
                            "curtxnid": "51c1176b-b026-45c4-a5b6-710c452380be",
                            "prvtxnid": null
                        }
                    }]
                }
            ]
            , "lsn": 876133360, "xid": 17547, "connected": false, "cleared": false
        };
        const initialState = {lsn: 0};
        const reducer = createReducer(initialState);
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
                            {"name": "curtxnid", "type": "character varying"},
                            {"name": "prvtxnid", "type": "character varying"},
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
                            {"name": "curtxnid", "type": "character varying"},
                            {"name": "prvtxnid", "type": "character varying"},
                            {"name": "firstName", "type": "character varying"},
                            {"name": "lastName", "type": "character varying"},
                        ],
                        "rows": [
                            {
                                "id": "d2ea6203-8228-4da4-9cc2-69f66b27704d",
                                "curtxnid": "f8ccc378-cf4f-487a-b6f4-90020430f1b8",
                                "prvtxnid": null, // TODO: null -> undefined
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