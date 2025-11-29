-- Check if RLS is enabled and see all policies
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'conversations';

-- Show all current policies on conversations
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY cmd, policyname;
