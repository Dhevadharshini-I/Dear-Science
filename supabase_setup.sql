-- ============================================================================
-- Dear Science — Supabase Backend Setup
-- ============================================================================
-- This script sets up the user_profiles table linked to Supabase Authentication.
-- It is safe to run multiple times (idempotent).
--
-- TABLE: user_profiles
--   - id           (uuid, PK, references auth.users — 1:1 with each user)
--   - username     (text, unique, not null — the user's chosen login name)
--   - full_name    (text, the user's display name)
--   - avatar_url   (text, nullable — URL to a profile picture)
--   - created_at   (timestamptz — when the profile was created)
--   - updated_at   (timestamptz — last modification, auto-updated by trigger)
--
-- SECURITY:
--   - Row Level Security (RLS) is enabled.
--   - Authenticated users can SELECT, INSERT, and UPDATE only their own row.
--   - DELETE is not granted — profiles are not deletable through the Data API.
--   - A trigger automatically updates updated_at on every row change.
--
-- AUTHENTICATION:
--   - Supabase Auth manages passwords in auth.users. No custom password table.
--   - The app uses username-based login. Usernames are mapped to a synthetic
--     email internally (username@dearscience.local) so Supabase Auth can
--     handle the credentials. Users never see or type an email address.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. Create the user_profiles table
-- --------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profiles (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text        NOT NULL,
  full_name   text        NOT NULL DEFAULT '',
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Unique index on username so no two users can have the same username
CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_key ON user_profiles (username);

-- --------------------------------------------------------------------------
-- 2. Enable Row Level Security
-- --------------------------------------------------------------------------

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 3. Grant privileges to the authenticated role only
--    (The app requires sign-in, so anon is not granted access.)
-- --------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- --------------------------------------------------------------------------
-- 4. RLS Policies — users can only access their own profile
-- --------------------------------------------------------------------------

-- SELECT: users can read only their own profile
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- INSERT: users can create only their own profile
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: users can update only their own profile
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------------
-- 5. Auto-updating updated_at trigger
-- --------------------------------------------------------------------------

-- Trigger function: sets updated_at to now() before any UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach the trigger to user_profiles (drop first for idempotency)
DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- --------------------------------------------------------------------------
-- Done. The user_profiles table is ready for use.
-- --------------------------------------------------------------------------
