ALTER TABLE "Banner"
ADD COLUMN "jumpType" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "jumpUrl" TEXT;

UPDATE "Banner"
SET
  "jumpUrl" = "linkUrl",
  "jumpType" = CASE
    WHEN "linkUrl" IS NULL OR btrim("linkUrl") = '' THEN 'none'
    WHEN "linkUrl" ~* '^https?://' THEN 'webview'
    ELSE 'miniapp'
  END;

ALTER TABLE "Banner" DROP COLUMN "linkUrl";
