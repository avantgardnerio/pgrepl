CREATE TABLE circles (
  id            CHARACTER VARYING NOT NULL PRIMARY KEY, -- TODO: UUID keys, multi-column keys
  cx            INT               NOT NULL,
  cy            INT               NOT NULL,
  r             INT               NOT NULL,
  "strokeWidth" INT               NOT NULL,
  stroke        CHARACTER VARYING,
  fill          CHARACTER VARYING,
  "curTxnId"    CHARACTER VARYING NOT NULL,
  "prvTxnId"    CHARACTER VARYING
);
ALTER TABLE circles
  REPLICA IDENTITY FULL;