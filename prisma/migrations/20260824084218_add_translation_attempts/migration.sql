-- CreateTable
CREATE TABLE "TranslationAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sentenceId" TEXT NOT NULL,
    "zhText" TEXT NOT NULL,
    "userTranslation" TEXT NOT NULL,
    "referenceTranslation" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "TranslationAttempt_createdAt_idx" ON "TranslationAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "TranslationAttempt_updatedAt_idx" ON "TranslationAttempt"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationAttempt_sentenceId_key" ON "TranslationAttempt"("sentenceId");
