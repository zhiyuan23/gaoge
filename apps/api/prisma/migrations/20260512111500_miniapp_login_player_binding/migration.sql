ALTER TABLE "Player"
ADD COLUMN IF NOT EXISTS "userId" INTEGER;

UPDATE "Player" AS p
SET "userId" = u."id"
FROM "User" AS u
WHERE p."openid" IS NOT NULL
  AND u."openid" IS NOT NULL
  AND p."openid" = u."openid"
  AND p."userId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Player_userId_key" ON "Player"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Player_userId_fkey'
  ) THEN
    ALTER TABLE "Player"
    ADD CONSTRAINT "Player_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
