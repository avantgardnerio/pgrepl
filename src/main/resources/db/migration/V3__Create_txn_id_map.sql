CREATE TABLE txn_id_map (
  xid           BIGINT NOT NULL PRIMARY KEY,
  client_txn_id CHARACTER VARYING -- TODO: UUID column
);