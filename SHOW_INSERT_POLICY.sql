-- Show the FULL with_check condition for INSERT policy
SELECT 
  policyname,
  pg_get_expr(polwithcheck, polrelid) as with_check_condition
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'conversations'
  AND polcmd = 'r'; -- 'r' = INSERT in pg_policy

-- Alternative: Show it more clearly
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversations'
  AND cmd = 'INSERT';
