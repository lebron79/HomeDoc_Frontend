-- Update the handle_new_user function to set a default avatar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    avatar,
    specialization,
    age,
    phone,
    gender,
    address,
    license_number,
    years_of_experience,
    education,
    bio,
    consultation_fee,
    available_days,
    available_hours
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'avatar-1'),  -- Default avatar
    NEW.raw_user_meta_data->>'specialization',
    (NEW.raw_user_meta_data->>'age')::INTEGER,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'gender',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'license_number',
    (NEW.raw_user_meta_data->>'years_of_experience')::INTEGER,
    NEW.raw_user_meta_data->>'education',
    NEW.raw_user_meta_data->>'bio',
    (NEW.raw_user_meta_data->>'consultation_fee')::DECIMAL,
    CASE 
      WHEN NEW.raw_user_meta_data->>'available_days' IS NOT NULL 
      THEN ARRAY(SELECT jsonb_array_elements_text((NEW.raw_user_meta_data->>'available_days')::jsonb))
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'available_hours'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update existing users who have NULL avatars
UPDATE user_profiles 
SET avatar = 'avatar-1' 
WHERE avatar IS NULL;
