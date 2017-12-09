SELECT
  tab.table_name       AS tableName,
  col.column_name      AS columnName,
  col.ordinal_position AS ordinalPosition,
  col.column_default   AS columnDefault,
  CASE
  WHEN col.is_nullable = 'NO'
    THEN FALSE
  ELSE TRUE
  END                  AS nullable,
  col.data_type        AS dataType,
  kcu.ordinal_position AS pkOrdinal
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
ORDER BY tab.table_name, col.ordinal_position;
