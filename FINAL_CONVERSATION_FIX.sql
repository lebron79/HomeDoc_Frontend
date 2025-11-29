-- CORRECT FIX - Remove the table reference in EXISTS subqueries
-- The bug was: WHERE user_profiles.id = conversations.patient_id
-- Should be: WHERE user_profiles.id = patient_id (direct column reference)

DROP POLICY IF EXISTS "Allow conversation creation" ON conversations;

CREATE POLICY "Allow conversation creation" ON conversations
  FOR INSERT 
  WITH CHECK (
    -- The authenticated user must be either the patient or doctor being inserted
    (auth.uid() = patient_id OR auth.uid() = doctor_id)
    AND
    -- Verify the patient exists with correct role (NO conversations. prefix!)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = patient_id 
      AND user_profiles.role = 'patient'
    )
    AND
    -- Verify the doctor exists with correct role (NO conversations. prefix!)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = doctor_id 
      AND user_profiles.role = 'doctor'
    )
  );
