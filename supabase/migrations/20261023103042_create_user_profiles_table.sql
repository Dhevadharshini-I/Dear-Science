/*
# Create user_profiles table with created_at and auto-updating trigger

1. New Tables
- `user_profiles`
  - `id` (uuid, PK — references auth.users, 1:1 with each user)
  - `full_name` (text, display name)
  - `avatar_url` (text, nullable — URL to profile picture)
  - `created_at` (timestamptz — when the profile was created)
  - `updated_at` (timestamptz — last modification, auto-updated by trigger)

2. Security
- RLS enabled on `user_profiles`.
- GRANT SELECT, INSERT, UPDATE to `authenticated` only.
- Three owner-scoped policies: select_own, insert_own, update_own (all check auth.uid() = id).
- DELETE intentionally not granted.

3. Trigger
- `set_updated_at()` function sets NEW.updated_at = now() before every UPDATE.
- Trigger `user_profiles_updated_at` attached BEFORE UPDATE on user_profiles.

4. Data migration
- Copies existing rows from the old `profiles` table into `user_profiles` (including created_at from updated_at as a best-effort proxy).

5. Notes
- The old `profiles` table is kept intact for backward compatibility — the app will switch to `user_profiles`.
- This migration is idempotent.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text        NOT NULL DEFAULT '',
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Migrate existing data from profiles -> user_profiles
INSERT INTO user_profiles (id, full_name, avatar_url, created_at, updated_at)
SELECT id, full_name, avatar_url, COALESCE(updated_at, now()), COALESCE(updated_at, now())
FROM profiles
ON CONFLICT (id) DO NOTHING;
