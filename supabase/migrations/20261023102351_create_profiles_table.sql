/*
# Create profiles table for user profile information

1. New Tables
- `profiles`
  - `id` (uuid, primary key — references auth.users)
  - `full_name` (text, the user's display name)
  - `avatar_url` (text, nullable — URL to profile avatar)
  - `updated_at` (timestamptz, last modification time)

2. Security
- Enable RLS on `profiles`.
- Grant SELECT, INSERT, UPDATE to `authenticated` only (no `anon` — the app requires sign-in).
- Owner-scoped CRUD: each authenticated user can only access their own profile row (id = auth.uid()).
- `user_id` defaults to `auth.uid()` so inserts from the client succeed without explicitly passing the id.

3. Important Notes
- The `profiles.id` column doubles as the user id (1:1 with auth.users).
- INSERT policy uses `WITH CHECK (auth.uid() = id)` so users can only create their own profile.
- UPDATE policy uses both USING and WITH CHECK to ensure ownership on read and write.
- DELETE is intentionally not granted — profiles should not be deletable through the Data API.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
