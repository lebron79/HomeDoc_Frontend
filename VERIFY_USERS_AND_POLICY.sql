-- Verify the patient and doctor exist with correct roles
SELECT 
  id,
  full_name,
  email,
  role
FROM user_profiles
WHERE id IN (
  '0b858e09-b7b8-4f9d-8777-1ad6b222875e',  -- doctor
  '1d18a25b-ca30-44d8-b3c7-47ad918f131c'   -- patient
);

-- Test the policy manually as the doctor
SELECT 
  auth.uid() = '0b858e09-b7b8-4f9d-8777-1ad6b222875e'::uuid as "am_i_doctor_id",
  auth.uid() = '1d18a25b-ca30-44d8-b3c7-47ad918f131c'::uuid as "am_i_patient_id",
  (
    auth.uid() = '1d18a25b-ca30-44d8-b3c7-47ad918f131c'::uuid 
    OR 
    auth.uid() = '0b858e09-b7b8-4f9d-8777-1ad6b222875e'::uuid
  ) as "am_i_one_of_them",
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = '1d18a25b-ca30-44d8-b3c7-47ad918f131c' 
    AND role = 'patient'
  ) as "patient_exists_with_role",
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = '0b858e09-b7b8-4f9d-8777-1ad6b222875e' 
    AND role = 'doctor'
  ) as "doctor_exists_with_role";
