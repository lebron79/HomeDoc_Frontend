-- Re-enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop the broken policy
DROP POLICY IF EXISTS "Allow conversation creation" ON conversations;

-- Create a working policy with proper column references
CREATE POLICY "Allow conversation creation" ON conversations
  AS PERMISSIVE
  FOR INSERT 
  TO public
  WITH CHECK (
    -- User must be either the patient or doctor
    (auth.uid() = patient_id OR auth.uid() = doctor_id)
    AND
    -- Patient must exist and have patient role
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = patient_id 
      AND up.role = 'patient'
    )
    AND
    -- Doctor must exist and have doctor role
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = doctor_id 
      AND up.role = 'doctor'
    )
  );

-- Verify it was created
SELECT policyname, with_check 
FROM pg_policies 
WHERE tablename = 'conversations' AND cmd = 'INSERT';
