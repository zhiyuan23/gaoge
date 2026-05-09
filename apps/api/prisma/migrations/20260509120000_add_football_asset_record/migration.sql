-- CreateTable
CREATE TABLE "FootballAssetRecord" (
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

-- CreateIndex
CREATE INDEX "FootballAssetRecord_direction_idx" ON "FootballAssetRecord"("direction");

-- CreateIndex
CREATE INDEX "FootballAssetRecord_recordType_idx" ON "FootballAssetRecord"("recordType");

-- CreateIndex
CREATE INDEX "FootballAssetRecord_recordDate_idx" ON "FootballAssetRecord"("recordDate");

-- CreateIndex
CREATE INDEX "FootballAssetRecord_status_idx" ON "FootballAssetRecord"("status");

-- CreateIndex
CREATE INDEX "FootballAssetRecord_seasonLabel_idx" ON "FootballAssetRecord"("seasonLabel");

-- CreateIndex
CREATE INDEX "FootballAssetRecord_matchLabel_idx" ON "FootballAssetRecord"("matchLabel");
