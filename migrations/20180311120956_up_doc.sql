CREATE TABLE document (
  "id"       UUID              NOT NULL PRIMARY KEY,
  "name"     VARCHAR           NOT NULL,
  "curTxnId" UUID NOT NULL,
  "prvTxnId" UUID
);
ALTER TABLE document REPLICA IDENTITY FULL;

CREATE TABLE line (
  "id"       UUID              NOT NULL PRIMARY KEY,
  "documentId" UUID NOT NULL REFERENCES document (id),
  "x1"     double precision           NOT NULL,
  "y1"     double precision           NOT NULL,
  "x2"     double precision           NOT NULL,
  "y2"     double precision           NOT NULL,
  "stroke-width" double precision,
  "stroke" character varying,
  "vector-effect" character varying,
  "curTxnId" UUID NOT NULL,
  "prvTxnId" UUID
);
ALTER TABLE document REPLICA IDENTITY FULL;

