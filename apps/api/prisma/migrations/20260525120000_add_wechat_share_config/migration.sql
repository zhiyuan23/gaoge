CREATE TABLE IF NOT EXISTS "WechatShareConfig" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "appId" TEXT NOT NULL DEFAULT '',
  "appSecret" TEXT NOT NULL DEFAULT '',
  "defaultImageUrl" TEXT NOT NULL DEFAULT '',
  "homeTitle" TEXT NOT NULL DEFAULT '',
  "homeDesc" TEXT NOT NULL DEFAULT '',
  "homeImageUrl" TEXT NOT NULL DEFAULT '',
  "teamsTitle" TEXT NOT NULL DEFAULT '',
  "teamsDesc" TEXT NOT NULL DEFAULT '',
  "teamsImageUrl" TEXT NOT NULL DEFAULT '',
  "assetsTitle" TEXT NOT NULL DEFAULT '',
  "assetsDesc" TEXT NOT NULL DEFAULT '',
  "assetsImageUrl" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WechatShareConfig_pkey" PRIMARY KEY ("id")
);
