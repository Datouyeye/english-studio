-- CreateTable
CREATE TABLE "PracticeSentence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zhText" TEXT NOT NULL,
    "enReference" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'ai',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PracticeSentence_scene_idx" ON "PracticeSentence"("scene");

-- CreateIndex
CREATE INDEX "PracticeSentence_createdAt_idx" ON "PracticeSentence"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSentence_zhText_key" ON "PracticeSentence"("zhText");
