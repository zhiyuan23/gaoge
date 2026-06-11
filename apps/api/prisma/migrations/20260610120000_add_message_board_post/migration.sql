CREATE TABLE "MessageBoardPost" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MessageBoardPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MessageBoardPost_status_idx" ON "MessageBoardPost"("status");
CREATE INDEX "MessageBoardPost_isPinned_idx" ON "MessageBoardPost"("isPinned");
CREATE INDEX "MessageBoardPost_publishedAt_idx" ON "MessageBoardPost"("publishedAt");
