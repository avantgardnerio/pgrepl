import createReducer from './index';

describe(`the reducer`, () => {
    it(`should allow insert while offline`, () => {
        const initialState = {
            lsn: 0
        };
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
});