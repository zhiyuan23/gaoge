CREATE TABLE "BasketballPlayer" (
    "id" SERIAL NOT NULL,
    "openid" TEXT,
    "playerNumber" INTEGER,
    "nickname" TEXT NOT NULL,
    "realName" TEXT,
    "avatarUrl" TEXT,
    "subTeam" TEXT,
    "jerseyName" TEXT,
    "birthDate" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT,
    "jerseySize" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "remark" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasketballPlayer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BasketballTeamFund" (
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

    CONSTRAINT "BasketballTeamFund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BasketballAssetRecord" (
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

    CONSTRAINT "BasketballAssetRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BasketballTeam" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "slogan" TEXT,
    "sponsorName" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasketballTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BasketballMatchRound" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasketballMatchRound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BasketballMatchRoundResult" (
    "id" SERIAL NOT NULL,
    "matchRoundId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BasketballMatchRoundResult_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BasketballMatchRoundResult_rank_check" CHECK ("rank" IN (1, 2, 3)),
    CONSTRAINT "BasketballMatchRoundResult_points_nonnegative_check" CHECK ("points" >= 0),
    CONSTRAINT "BasketballMatchRoundResult_rank_points_check" CHECK (
        ("rank" = 1 AND "points" = 2)
        OR ("rank" = 2 AND "points" = 1)
        OR ("rank" = 3 AND "points" = 0)
    )
);

CREATE UNIQUE INDEX "BasketballPlayer_openid_key" ON "BasketballPlayer"("openid");
CREATE UNIQUE INDEX "BasketballPlayer_playerNumber_key" ON "BasketballPlayer"("playerNumber");
CREATE UNIQUE INDEX "BasketballPlayer_nickname_key" ON "BasketballPlayer"("nickname");
CREATE UNIQUE INDEX "BasketballPlayer_userId_key" ON "BasketballPlayer"("userId");
CREATE INDEX "BasketballPlayer_playerNumber_idx" ON "BasketballPlayer"("playerNumber");
CREATE INDEX "BasketballPlayer_openid_idx" ON "BasketballPlayer"("openid");
CREATE INDEX "BasketballPlayer_nickname_idx" ON "BasketballPlayer"("nickname");
CREATE INDEX "BasketballPlayer_subTeam_idx" ON "BasketballPlayer"("subTeam");

CREATE INDEX "BasketballTeamFund_type_idx" ON "BasketballTeamFund"("type");
CREATE INDEX "BasketballTeamFund_recordDate_idx" ON "BasketballTeamFund"("recordDate");
CREATE INDEX "BasketballTeamFund_status_idx" ON "BasketballTeamFund"("status");

CREATE INDEX "BasketballAssetRecord_direction_idx" ON "BasketballAssetRecord"("direction");
CREATE INDEX "BasketballAssetRecord_recordType_idx" ON "BasketballAssetRecord"("recordType");
CREATE INDEX "BasketballAssetRecord_recordDate_idx" ON "BasketballAssetRecord"("recordDate");
CREATE INDEX "BasketballAssetRecord_status_idx" ON "BasketballAssetRecord"("status");
CREATE INDEX "BasketballAssetRecord_seasonLabel_idx" ON "BasketballAssetRecord"("seasonLabel");
CREATE INDEX "BasketballAssetRecord_matchLabel_idx" ON "BasketballAssetRecord"("matchLabel");

CREATE UNIQUE INDEX "BasketballTeam_code_key" ON "BasketballTeam"("code");
CREATE UNIQUE INDEX "BasketballTeam_name_key" ON "BasketballTeam"("name");
CREATE INDEX "BasketballTeam_sort_idx" ON "BasketballTeam"("sort");

CREATE INDEX "BasketballMatchRound_matchDate_idx" ON "BasketballMatchRound"("matchDate");

CREATE UNIQUE INDEX "BasketballMatchRoundResult_matchRoundId_teamId_key" ON "BasketballMatchRoundResult"("matchRoundId", "teamId");
CREATE UNIQUE INDEX "BasketballMatchRoundResult_matchRoundId_rank_key" ON "BasketballMatchRoundResult"("matchRoundId", "rank");
CREATE INDEX "BasketballMatchRoundResult_teamId_idx" ON "BasketballMatchRoundResult"("teamId");

ALTER TABLE "BasketballMatchRoundResult"
    ADD CONSTRAINT "BasketballMatchRoundResult_matchRoundId_fkey"
    FOREIGN KEY ("matchRoundId") REFERENCES "BasketballMatchRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BasketballMatchRoundResult"
    ADD CONSTRAINT "BasketballMatchRoundResult_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "BasketballTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
