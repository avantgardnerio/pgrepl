CREATE TABLE "txnIdMap" (
  xid           BIGINT NOT NULL PRIMARY KEY,
  "clientTxnId" UUID
);