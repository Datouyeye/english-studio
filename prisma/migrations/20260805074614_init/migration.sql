-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "adaptedText" TEXT NOT NULL,
    "targetLevel" TEXT NOT NULL,
    "sourceLanguage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LearningItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT,
    "text" TEXT NOT NULL,
    "normalizedText" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "meaningZh" TEXT NOT NULL DEFAULT '',
    "explanationEn" TEXT NOT NULL DEFAULT '',
    "sourceSentence" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "sourceType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Material_createdAt_idx" ON "Material"("createdAt");

-- CreateIndex
CREATE INDEX "LearningItem_createdAt_idx" ON "LearningItem"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LearningItem_materialId_normalizedText_key" ON "LearningItem"("materialId", "normalizedText");
