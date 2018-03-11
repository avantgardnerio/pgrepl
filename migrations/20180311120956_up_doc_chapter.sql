CREATE TABLE document (
  "id"       UUID              NOT NULL PRIMARY KEY,
  "name"     VARCHAR           NOT NULL,
  "curTxnId" UUID NOT NULL,
  "prvTxnId" UUID
);
ALTER TABLE document REPLICA IDENTITY FULL;

CREATE TABLE chapter (
  "id"       UUID              NOT NULL PRIMARY KEY,
  "documentId" UUID NOT NULL REFERENCES document (id),
  "name"     VARCHAR           NOT NULL,
  "curTxnId" UUID NOT NULL,
  "prvTxnId" UUID
);
ALTER TABLE document REPLICA IDENTITY FULL;

