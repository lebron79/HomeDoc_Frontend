-- Allow doctors to view patient profiles through medical cases
-- This enables doctors to see patient names in the cases list

-- Drop the policy if it already exists
DROP POLICY IF EXISTS "Doctors can view patients through cases" ON user_profiles;

CREATE POLICY "Doctors can view patients through cases" ON user_profiles
  FOR SELECT USING (
    id IN (
      SELECT patient_id FROM medical_cases
      WHERE (status = 'pending' OR doctor_id = auth.uid())
      AND patient_id IS NOT NULL
    )
  );

COMMENT ON POLICY "Doctors can view patients through cases" ON user_profiles IS 
  'Allows doctors to view patient profile data (name, age) for pending cases and their assigned cases';
