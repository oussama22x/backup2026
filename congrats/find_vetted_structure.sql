-- 1. List all columns in the 'projects' table to see what's available
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects';

-- 2. Select EVERYTHING for that project to see the data structure
SELECT * 
FROM projects 
WHERE id = 'bd37cd69-6d0d-4794-95cc-0fc001c4a96d';
