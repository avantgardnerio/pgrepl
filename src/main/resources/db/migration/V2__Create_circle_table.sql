CREATE TABLE circles (
  id          CHARACTER VARYING NOT NULL, -- TODO: UUID keys, multi-column keys
  cx          INT,
  cy          INT,
  r           INT,
  stroke      CHARACTER VARYING,
  strokeWidth CHARACTER VARYING,
  fill        CHARACTER VARYING
);