SELECT
  tab.table_name       AS "tableName",
  col.column_name      AS "columnName",
  col.ordinal_position AS "ordinalPosition",
  col.column_default   AS "columnDefault",
  CASE
  WHEN col.is_nullable = 'NO'
    THEN FALSE
  ELSE TRUE
  END                  AS "nullable",
  col.data_type        AS "dataType",
  kcu.ordinal_position AS "pkOrdinal"
FROM information_schema.tables tab
  INNER JOIN information_schema.columns col
    ON tab.table_name = col.table_name
       AND tab.table_catalog = col.table_catalog
       AND tab.table_schema = col.table_schema
  LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    ON kcu.table_catalog = tab.table_catalog
       AND kcu.table_schema = tab.table_schema
       AND kcu.table_name = tab.table_name
       AND kcu.column_name = col.column_name
WHERE tab.table_schema = 'public'
      AND tab.table_type = 'BASE TABLE'
      AND tab.table_name NOT LIKE '__migrations__'
ORDER BY tab.table_name, col.ordinal_position;

SELECT
  tc.constraint_catalog as catalog,
  tc.constraint_schema as schema,
  tc.constraint_name as "constraint",
  kcu.ordinal_position as "ordinalPosition",
  kcu.table_name as "foreignTable",
  kcu.column_name as "foreignColumn",
  ccu.table_name as "primaryTable",
  ccu.column_name as "primaryColumn"
FROM
  information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
where tc.constraint_type='FOREIGN KEY'
ORDER BY
  tc.constraint_catalog,
  tc.constraint_schema,
  tc.constraint_name,
  kcu.ordinal_position;
