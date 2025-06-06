SELECT
    table_name,
    index_name,
    COUNT(*) as columns_count
FROM information_schema.statistics
WHERE table_schema = 'shifts_db'
GROUP BY table_name, index_name
HAVING COUNT(*) > 1
ORDER BY table_name, index_name;