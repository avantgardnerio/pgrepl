export const state = {
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
        }
    },
    "log": [{
        "id": "36c793fa-84d8-4ac8-a803-68f3b99f2cae",
        "changes": [{
            "type": "DELETE",
            "table": "circles",
            "record": {
                "id": "f0fdac18-05e0-4668-abaf-fade21fe2f46",
                "cx": 169,
                "cy": 226,
                "r": 40,
                "stroke": "green",
                "strokewidth": "4",
                "fill": "yellow",
                "curtxnid": "36c793fa-84d8-4ac8-a803-68f3b99f2cae",
                "prvtxnid": "d6e88301-3cfe-4f47-9330-8a3aaf58a26f"
            },
            "prior": {
                "id": "f0fdac18-05e0-4668-abaf-fade21fe2f46",
                "cx": 169,
                "cy": 226,
                "r": 40,
                "stroke": "green",
                "strokewidth": "4",
                "fill": "yellow",
                "curtxnid": "d6e88301-3cfe-4f47-9330-8a3aaf58a26f",
                "prvtxnid": null
            }
        }]
    }],
    "lsn": 873982639,
    "xid": 0,
    "connected": true,
    "cleared": false
};
export const action = {
    "type": "TXN",
    "payload": {
        "xid": 17505,
        "nextlsn": "0/3417ED18",
        "timestamp": "2018-01-01 16:20:55.206049-05",
        "clientTxnId": "36c793fa-84d8-4ac8-a803-68f3b99f2cae",
        "lsn": 873982864,
        "change": [{
            "kind": "delete",
            "table": "circles",
            "oldkeys": {
                "keynames": ["id", "cx", "cy", "r", "stroke", "strokewidth", "fill", "curtxnid"],
                "keyvalues": ["f0fdac18-05e0-4668-abaf-fade21fe2f46", 169, 226, 40, "green", "4", "yellow", "d6e88301-3cfe-4f47-9330-8a3aaf58a26f"]
            }
        }, {
            "kind": "insert",
            "table": "txn_id_map",
            "columnnames": ["xid", "client_txn_id"],
            "columnvalues": [17505, "36c793fa-84d8-4ac8-a803-68f3b99f2cae"]
        }]
    }
};
export const expected = {
    "tables": {
        "circles": {
            "rows": [
                {
                    "id": "f0fdac18-05e0-4668-abaf-fade21fe2f46",
                    "cx": 169,
                    "cy": 226,
                    "r": 40,
                    "stroke": "green",
                    "strokewidth": "4",
                    "fill": "yellow",
                    "curtxnid": "d6e88301-3cfe-4f47-9330-8a3aaf58a26f",
                    "prvtxnid": null
                }
            ],
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
        }
    },
    "log": [],
    "lsn": 873982639,
    "xid": 0,
    "connected": true,
    "cleared": false
};