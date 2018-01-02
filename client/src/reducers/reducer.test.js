import createReducer from './index';

describe(`the reducer`, () => {
    it(`should allow insert while offline`, () => {
        const initialState = {lsn: 0};
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