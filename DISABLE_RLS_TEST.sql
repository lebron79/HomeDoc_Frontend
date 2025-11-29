-- NUCLEAR OPTION - Disable RLS temporarily to test
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Test if insert works now (it should)
-- Try inserting from your app

-- Then re-enable and recreate policy
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- Then run the policy creation again
