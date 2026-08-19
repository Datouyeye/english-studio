import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  buildExportFilename,
  buildMaterialMarkdown,
  getMaterialWithItemsForExport,
} from "@/services/export-service";
import { cleanDatabase } from "../helpers/cleanup";

beforeEach(async () => {
  await cleanDatabase();
});

describe("export-service", () => {
  it("生成的 Markdown 包含 frontmatter、原文、改写与学习内容（含写作示例）", async () => {
    const material = await prisma.material.create({
      data: {
        title: 'A "Great" Story',
        originalText: "原始材料。",
        adaptedText: "Adapted English text here.",
        targetLevel: "IELTS",
        sourceLanguage: "zh",
        learningItems: {
          create: [
            {
              text: "habit",
              normalizedText: "habit",
              itemType: "word",
              meaningZh: "习惯",
              explanationEn: "something you do regularly",
              writingUsage: "Example: She has a good habit. Use it in essays about routine.",
              sourceSentence: "She has a good habit.",
              notes: "常用",
              sourceType: "ai",
              sortOrder: 0,
            },
          ],
        },
      },
      include: { learningItems: true },
    });

    const full = await getMaterialWithItemsForExport(material.id);
    const md = buildMaterialMarkdown(full);
    expect(md).toContain("---");
    expect(md).toContain(`materialId: ${material.id}`);
    expect(md).toContain("targetLevel: IELTS");
    expect(md).toContain('# A "Great" Story');
    expect(md).toContain("## 原始材料");
    expect(md).toContain("## 改写后的英文文章");
    expect(md).toContain("## 学习内容");
    expect(md).toContain("habit");
    expect(md).toContain("写作示例");
    expect(md).toContain("Use it in essays about routine.");
    expect(md).toContain("LearningItem ID");
    expect(md).toContain(material.learningItems[0].id);

    const filename = buildExportFilename(material);
    expect(filename.endsWith(".md")).toBe(true);
  });
});