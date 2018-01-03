CREATE TABLE "txnIdMap" (
  xid           BIGINT NOT NULL PRIMARY KEY,
  "clientTxnId" CHARACTER VARYING -- TODO: UUID column
);