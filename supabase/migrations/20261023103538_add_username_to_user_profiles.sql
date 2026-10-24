/*
# Add username column to user_profiles

1. Changes
- Add `username` column (text) to `user_profiles`.
- Backfill existing rows with a derived username.
- Make the column NOT NULL with a unique index.

2. Security
- No policy changes — existing RLS policies already scope by auth.uid() = id.

3. Notes
- Idempotent.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text;
  END IF;
END $$;

-- Backfill existing rows with a derived username from full_name
UPDATE user_profiles
SET username = CASE
  WHEN TRIM(full_name) != '' THEN LOWER(REPLACE(TRIM(full_name), ' ', '.'))
  ELSE 'user' || LEFT(id::text, 8)
END
WHERE username IS NULL;

ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_key ON user_profiles (username);
