-- 等级值迁移：A2/B1/B2 -> CET4/CET6/IELTS（SQLite 枚举为 TEXT，需手动更新旧数据）
UPDATE "Material" SET "targetLevel" = 'CET4' WHERE "targetLevel" = 'A2';
UPDATE "Material" SET "targetLevel" = 'CET6' WHERE "targetLevel" = 'B1';
UPDATE "Material" SET "targetLevel" = 'IELTS' WHERE "targetLevel" = 'B2';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LearningItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "meaningZh" TEXT NOT NULL DEFAULT '',
    "explanationEn" TEXT NOT NULL DEFAULT '',
    "writingUsage" TEXT NOT NULL DEFAULT '',
    "sourceSentence" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LearningItem" ("createdAt", "explanationEn", "id", "itemType", "materialId", "meaningZh", "normalizedText", "notes", "sortOrder", "sourceSentence", "sourceType", "text", "updatedAt") SELECT "createdAt", "explanationEn", "id", "itemType", "materialId", "meaningZh", "normalizedText", "notes", "sortOrder", "sourceSentence", "sourceType", "text", "updatedAt" FROM "LearningItem";
DROP TABLE "LearningItem";
ALTER TABLE "new_LearningItem" RENAME TO "LearningItem";
CREATE INDEX "LearningItem_createdAt_idx" ON "LearningItem"("createdAt");
CREATE UNIQUE INDEX "LearningItem_materialId_normalizedText_key" ON "LearningItem"("materialId", "normalizedText");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
