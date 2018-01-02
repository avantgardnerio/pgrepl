import {rollbackLog} from "./db";

describe('db', () => {
    it('should be able to rollback the log', () => {
        const state = {
            "tables": {
                "person": {
                    "rows": [],
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                }
            },
            "log": [
                {
                    "id": "775bbec5-a8f6-4eff-af8a-38a813a4adfd",
                    "changes": [
                        {
                            "type": "DELETE",
                            "table": "person",
                            "record": {
                                "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                                "firstName": "Alan",
                                "lastName": "Turing",
                                "curtxnid": "775bbec5-a8f6-4eff-af8a-38a813a4adfd",
                                "prvtxnid": "4a550c8a-628d-49a4-bf79-3380d35f960d"
                            },
                            "prior": {
                                "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                                "firstName": "Alan",
                                "lastName": "Turing",
                                "curtxnid": "4a550c8a-628d-49a4-bf79-3380d35f960d",
                                "prvtxnid": null
                            }
                        }
                    ]
                }
            ]
        };
        const expected = {
            "tables": {
                "person": {
                    "rows": [
                        {
                            "id": "36a4fada-660f-4649-803a-b2fc6fedc292",
                            "firstName": "Alan",
                            "lastName": "Turing",
                            "curtxnid": "4a550c8a-628d-49a4-bf79-3380d35f960d",
                            "prvtxnid": null
                        }
                    ],
                    "columns": [{"name": "id", "type": "character varying", "pkOrdinal": 1}]
                }
            },
            "log": []
        };
        const actual = rollbackLog(state);
        expect(actual).toEqual(expected);
    })
});