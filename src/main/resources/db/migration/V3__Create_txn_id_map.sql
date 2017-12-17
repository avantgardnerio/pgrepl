CREATE TABLE txn_id_map (
  xid           BIGINT NOT NULL,
  client_txn_id CHARACTER VARYING -- TODO: UUID column
);