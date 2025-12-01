UPDATE opportunities
SET vetted_project_id = 'ff395a72-ddb8-4693-a46a-09a0b5a53585'
WHERE id = (
  SELECT opportunity_id
  FROM audition_submissions
  WHERE id = '089cb973-8c19-4ab7-b5fc-133b5ba344f4'
);
