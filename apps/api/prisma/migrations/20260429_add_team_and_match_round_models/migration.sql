CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slogan" TEXT,
    "sponsorName" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchRound" (
    "id" SERIAL NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchRound_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchRoundResult" (
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

CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");
CREATE INDEX "Team_sort_idx" ON "Team"("sort");

CREATE INDEX "MatchRound_matchDate_idx" ON "MatchRound"("matchDate");

CREATE UNIQUE INDEX "MatchRoundResult_matchRoundId_teamId_key" ON "MatchRoundResult"("matchRoundId", "teamId");
CREATE UNIQUE INDEX "MatchRoundResult_matchRoundId_rank_key" ON "MatchRoundResult"("matchRoundId", "rank");
CREATE INDEX "MatchRoundResult_teamId_idx" ON "MatchRoundResult"("teamId");

ALTER TABLE "MatchRoundResult"
    ADD CONSTRAINT "MatchRoundResult_matchRoundId_fkey"
    FOREIGN KEY ("matchRoundId") REFERENCES "MatchRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchRoundResult"
    ADD CONSTRAINT "MatchRoundResult_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
