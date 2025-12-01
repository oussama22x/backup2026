-- Create a function to automatically create recruiter profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.recruiters (user_id, email, full_name, company_name, user_role, company_size, referral_source, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_role', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_size', ''),
    COALESCE(NEW.raw_user_meta_data->>'referral_source', NULL),
    'active'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    user_role = EXCLUDED.user_role,
    company_size = EXCLUDED.company_size,
    referral_source = EXCLUDED.referral_source,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
