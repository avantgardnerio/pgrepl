CREATE TABLE circles (
  id          CHARACTER VARYING NOT NULL PRIMARY KEY, -- TODO: UUID keys, multi-column keys
  cx          INT,
  cy          INT,
  r           INT,
  stroke      CHARACTER VARYING,
  strokeWidth CHARACTER VARYING,
  fill        CHARACTER VARYING,
  curTxnId    CHARACTER VARYING NOT NULL,
  prvTxnId    CHARACTER VARYING
);
ALTER TABLE circles
  REPLICA IDENTITY FULL;