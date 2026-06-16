-- AlterTable
ALTER TABLE "MatchRound" ALTER COLUMN "year" DROP DEFAULT,
ALTER COLUMN "season" DROP DEFAULT,
ALTER COLUMN "round" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Menu" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MessageBoardPost" ALTER COLUMN "tags" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "WechatShareConfig" ALTER COLUMN "updatedAt" DROP DEFAULT;
