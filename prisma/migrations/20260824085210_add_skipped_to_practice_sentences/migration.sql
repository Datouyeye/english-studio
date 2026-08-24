-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PracticeSentence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "zhText" TEXT NOT NULL,
    "enReference" TEXT NOT NULL,
    "scene" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'ai',
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PracticeSentence" ("createdAt", "enReference", "id", "scene", "sourceType", "zhText") SELECT "createdAt", "enReference", "id", "scene", "sourceType", "zhText" FROM "PracticeSentence";
DROP TABLE "PracticeSentence";
ALTER TABLE "new_PracticeSentence" RENAME TO "PracticeSentence";
CREATE INDEX "PracticeSentence_scene_idx" ON "PracticeSentence"("scene");
CREATE INDEX "PracticeSentence_createdAt_idx" ON "PracticeSentence"("createdAt");
CREATE UNIQUE INDEX "PracticeSentence_zhText_key" ON "PracticeSentence"("zhText");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
