CREATE TABLE circles (
  id          CHARACTER VARYING NOT NULL PRIMARY KEY, -- TODO: UUID keys, multi-column keys
  cx          INT               NOT NULL,
  cy          INT               NOT NULL,
  r           INT               NOT NULL,
  stroke      CHARACTER VARYING,
  strokeWidth CHARACTER VARYING,
  fill        CHARACTER VARYING,
  curtxnid    CHARACTER VARYING NOT NULL,
  prvtxnid    CHARACTER VARYING
);
ALTER TABLE circles
  REPLICA IDENTITY FULL;