-- List all columns in 'role_definitions'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'role_definitions';
