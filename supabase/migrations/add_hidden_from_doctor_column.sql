-- Add hidden_from_doctor column to medical_cases table
ALTER TABLE medical_cases
ADD COLUMN IF NOT EXISTS hidden_from_doctor BOOLEAN DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_medical_cases_hidden_from_doctor 
ON medical_cases(hidden_from_doctor) 
WHERE hidden_from_doctor IS NULL;

-- Add comment
COMMENT ON COLUMN medical_cases.hidden_from_doctor IS 'When true, case is hidden from doctor view but visible to admin';
