-- ====================================================================
-- SAKHI SOLO FEMALE TRAVEL - AUTOMATIC USER PROFILE TRIGGER & POLICIES
-- Run this in Supabase Cloud: SQL Editor -> New Query -> Run
-- ====================================================================

-- 1. Ensure email column exists on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Allow newly created users to insert/upsert their public profile
DROP POLICY IF EXISTS "Allow insert user profile" ON public.users;
CREATE POLICY "Allow insert user profile" ON public.users 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update own profile" ON public.users;
CREATE POLICY "Allow update own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id OR auth.uid() IS NULL);

-- 3. Automatic Trigger: Mirrors every new user created in auth.users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    home_country,
    is_verified,
    created_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Traveller'),
    COALESCE(new.raw_user_meta_data->>'home_country', 'United States'),
    (new.confirmed_at IS NOT NULL),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    home_country = EXCLUDED.home_country,
    is_verified = EXCLUDED.is_verified;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
