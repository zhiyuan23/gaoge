ALTER TABLE "Team"
    ADD COLUMN "avatarUrl" TEXT;

ALTER TABLE "MatchRound"
    ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2026,
    ADD COLUMN "season" TEXT NOT NULL DEFAULT '春季赛',
    ADD COLUMN "round" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "MatchRound"
    ADD CONSTRAINT "MatchRound_round_check" CHECK ("round" >= 1 AND "round" <= 15);
