-- Persisted profanity/forbidden-word rules for community post creation.
-- Nullable review markers are safe SQLite additions for existing community rows.

-- AlterTable
ALTER TABLE "DiscussionThread" ADD COLUMN "needsReviewAt" DATETIME;

-- AlterTable
ALTER TABLE "DiscussionComment" ADD COLUMN "needsReviewAt" DATETIME;

-- CreateTable
CREATE TABLE "ForbiddenWord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phrase" TEXT NOT NULL,
    "normalizedPhrase" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'BLOCK',
    "matchType" TEXT NOT NULL DEFAULT 'WHOLE_WORD',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ForbiddenWord_normalizedPhrase_key" ON "ForbiddenWord"("normalizedPhrase");

-- CreateIndex
CREATE INDEX "ForbiddenWord_enabled_action_idx" ON "ForbiddenWord"("enabled", "action");

-- CreateIndex
CREATE INDEX "ForbiddenWord_createdAt_idx" ON "ForbiddenWord"("createdAt");

-- CreateIndex
CREATE INDEX "DiscussionThread_needsReviewAt_createdAt_idx" ON "DiscussionThread"("needsReviewAt", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionComment_needsReviewAt_createdAt_idx" ON "DiscussionComment"("needsReviewAt", "createdAt");
