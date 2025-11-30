-- List all columns in the 'audition_scaffolds' table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audition_scaffolds';
