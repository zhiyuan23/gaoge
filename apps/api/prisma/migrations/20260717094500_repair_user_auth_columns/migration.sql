ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "openid" TEXT,
  ADD COLUMN IF NOT EXISTS "unionid" TEXT,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user',
  ALTER COLUMN "account" DROP NOT NULL,
  ALTER COLUMN "passwordHash" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_openid_key" ON "User"("openid");
CREATE UNIQUE INDEX IF NOT EXISTS "User_unionid_key" ON "User"("unionid");
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "User_account_key" ON "User"("account");

CREATE INDEX IF NOT EXISTS "User_openid_idx" ON "User"("openid");
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
