CREATE TABLE IF NOT EXISTS "Team" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "avatarUrl" TEXT,
  "slogan" TEXT,
  "sponsorName" TEXT,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Player" (
  "id" SERIAL NOT NULL,
  "openid" TEXT,
  "playerNumber" INTEGER,
  "nickname" TEXT NOT NULL,
  "realName" TEXT,
  "avatarUrl" TEXT,
  "subTeam" TEXT,
  "primaryTeamId" INTEGER,
  "jerseyName" TEXT,
  "birthDate" TIMESTAMP(3),
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "position" TEXT,
  "positions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "primaryPosition" TEXT,
  "jerseySize" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "signature" TEXT,
  "remark" TEXT,
  "userId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlayerTeam" (
  "playerId" INTEGER NOT NULL,
  "teamId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerTeam_pkey" PRIMARY KEY ("playerId", "teamId")
);

CREATE TABLE IF NOT EXISTS "MatchRound" (
  "year" INTEGER NOT NULL,
  "season" TEXT NOT NULL,
  "round" INTEGER NOT NULL,
  "id" SERIAL NOT NULL,
  "collectTeamFee" BOOLEAN NOT NULL DEFAULT true,
  "matchDate" TIMESTAMP(3) NOT NULL,
  "venue" TEXT,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchRound_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MatchRound_round_check" CHECK ("round" >= 1 AND "round" <= 15)
);

CREATE TABLE IF NOT EXISTS "MatchRoundResult" (
  "id" SERIAL NOT NULL,
  "matchRoundId" INTEGER NOT NULL,
  "teamId" INTEGER NOT NULL,
  "rank" INTEGER NOT NULL,
  "points" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatchRoundResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MatchRoundResult_rank_check" CHECK ("rank" IN (1, 2, 3)),
  CONSTRAINT "MatchRoundResult_points_nonnegative_check" CHECK ("points" >= 0),
  CONSTRAINT "MatchRoundResult_rank_points_check" CHECK (
    ("rank" = 1 AND "points" = 2)
    OR ("rank" = 2 AND "points" = 1)
    OR ("rank" = 3 AND "points" = 0)
  )
);

CREATE TABLE IF NOT EXISTS "TeamFund" (
  "id" SERIAL NOT NULL,
  "type" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "recordDate" TIMESTAMP(3) NOT NULL,
  "creatorId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamFund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FootballAssetRecord" (
  "id" SERIAL NOT NULL,
  "direction" TEXT NOT NULL,
  "recordType" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "seasonLabel" TEXT,
  "matchLabel" TEXT,
  "isWaived" BOOLEAN NOT NULL DEFAULT false,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "recordDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'confirmed',
  "creatorId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FootballAssetRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Banner" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "imageUrl" TEXT NOT NULL,
  "jumpType" TEXT NOT NULL DEFAULT 'none',
  "jumpUrl" TEXT,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "MessageBoardPost" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MessageBoardPost_pkey" PRIMARY KEY ("id")
);

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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WechatShareConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Team_code_key" ON "Team"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "Team_name_key" ON "Team"("name");
CREATE INDEX IF NOT EXISTS "Team_sort_idx" ON "Team"("sort");

CREATE UNIQUE INDEX IF NOT EXISTS "Player_openid_key" ON "Player"("openid");
CREATE UNIQUE INDEX IF NOT EXISTS "Player_playerNumber_key" ON "Player"("playerNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Player_nickname_key" ON "Player"("nickname");
CREATE UNIQUE INDEX IF NOT EXISTS "Player_userId_key" ON "Player"("userId");
CREATE INDEX IF NOT EXISTS "Player_playerNumber_idx" ON "Player"("playerNumber");
CREATE INDEX IF NOT EXISTS "Player_openid_idx" ON "Player"("openid");
CREATE INDEX IF NOT EXISTS "Player_nickname_idx" ON "Player"("nickname");
CREATE INDEX IF NOT EXISTS "Player_subTeam_idx" ON "Player"("subTeam");
CREATE INDEX IF NOT EXISTS "Player_primaryTeamId_idx" ON "Player"("primaryTeamId");
CREATE INDEX IF NOT EXISTS "Player_primaryPosition_idx" ON "Player"("primaryPosition");

CREATE INDEX IF NOT EXISTS "PlayerTeam_teamId_idx" ON "PlayerTeam"("teamId");

CREATE INDEX IF NOT EXISTS "MatchRound_matchDate_idx" ON "MatchRound"("matchDate");
CREATE INDEX IF NOT EXISTS "MatchRoundResult_teamId_idx" ON "MatchRoundResult"("teamId");
CREATE UNIQUE INDEX IF NOT EXISTS "MatchRoundResult_matchRoundId_teamId_key" ON "MatchRoundResult"("matchRoundId", "teamId");
CREATE UNIQUE INDEX IF NOT EXISTS "MatchRoundResult_matchRoundId_rank_key" ON "MatchRoundResult"("matchRoundId", "rank");

CREATE INDEX IF NOT EXISTS "TeamFund_type_idx" ON "TeamFund"("type");
CREATE INDEX IF NOT EXISTS "TeamFund_recordDate_idx" ON "TeamFund"("recordDate");
CREATE INDEX IF NOT EXISTS "TeamFund_status_idx" ON "TeamFund"("status");

CREATE INDEX IF NOT EXISTS "FootballAssetRecord_direction_idx" ON "FootballAssetRecord"("direction");
CREATE INDEX IF NOT EXISTS "FootballAssetRecord_recordType_idx" ON "FootballAssetRecord"("recordType");
CREATE INDEX IF NOT EXISTS "FootballAssetRecord_recordDate_idx" ON "FootballAssetRecord"("recordDate");
CREATE INDEX IF NOT EXISTS "FootballAssetRecord_status_idx" ON "FootballAssetRecord"("status");
CREATE INDEX IF NOT EXISTS "FootballAssetRecord_seasonLabel_idx" ON "FootballAssetRecord"("seasonLabel");
CREATE INDEX IF NOT EXISTS "FootballAssetRecord_matchLabel_idx" ON "FootballAssetRecord"("matchLabel");

CREATE INDEX IF NOT EXISTS "Banner_status_sort_idx" ON "Banner"("status", "sort");

CREATE INDEX IF NOT EXISTS "MessageBoardPost_status_idx" ON "MessageBoardPost"("status");
CREATE INDEX IF NOT EXISTS "MessageBoardPost_isPinned_idx" ON "MessageBoardPost"("isPinned");
CREATE INDEX IF NOT EXISTS "MessageBoardPost_publishedAt_idx" ON "MessageBoardPost"("publishedAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Player_primaryTeamId_fkey') THEN
    ALTER TABLE "Player"
      ADD CONSTRAINT "Player_primaryTeamId_fkey"
      FOREIGN KEY ("primaryTeamId") REFERENCES "Team"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Player_userId_fkey') THEN
    ALTER TABLE "Player"
      ADD CONSTRAINT "Player_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlayerTeam_playerId_fkey') THEN
    ALTER TABLE "PlayerTeam"
      ADD CONSTRAINT "PlayerTeam_playerId_fkey"
      FOREIGN KEY ("playerId") REFERENCES "Player"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PlayerTeam_teamId_fkey') THEN
    ALTER TABLE "PlayerTeam"
      ADD CONSTRAINT "PlayerTeam_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MatchRoundResult_matchRoundId_fkey') THEN
    ALTER TABLE "MatchRoundResult"
      ADD CONSTRAINT "MatchRoundResult_matchRoundId_fkey"
      FOREIGN KEY ("matchRoundId") REFERENCES "MatchRound"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MatchRoundResult_teamId_fkey') THEN
    ALTER TABLE "MatchRoundResult"
      ADD CONSTRAINT "MatchRoundResult_teamId_fkey"
      FOREIGN KEY ("teamId") REFERENCES "Team"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
