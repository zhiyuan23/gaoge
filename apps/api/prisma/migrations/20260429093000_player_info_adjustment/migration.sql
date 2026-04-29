ALTER TABLE "Player"
    ALTER COLUMN "openid" DROP NOT NULL;

ALTER TABLE "Player"
    ADD COLUMN "playerNumber" INTEGER;

CREATE UNIQUE INDEX "Player_playerNumber_key" ON "Player"("playerNumber");
CREATE INDEX "Player_playerNumber_idx" ON "Player"("playerNumber");
