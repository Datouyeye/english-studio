import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateMaterialAction } from "@/app/actions/material";
import {
  addLearningItemAction,
  deleteLearningItemAction,
  updateLearningItemAction,
} from "@/app/actions/learning-item";
import { prisma } from "@/lib/db";
import { cleanDatabase } from "../helpers/cleanup";

// revalidatePath 需要 Next 请求上下文，在测试环境中用 mock 代替。
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function redirectDigest(error: unknown): string | undefined {
  return (error as { digest?: string })?.digest;
}

beforeEach(async () => {
  await cleanDatabase();
  process.env.MOCK_AI = "1";
});

describe("generateMaterialAction", () => {
  it("合法输入：重定向到新材料阅读页", async () => {
    const formData = new FormData();
    formData.set("title", "Action 测试");
    formData.set("originalText", "这是一段用于测试的中文材料，用来生成一篇英文文章。");
    formData.set("targetLevel", "CET6");
    try {
      await generateMaterialAction(undefined, formData);
      expect.unreachable("应当抛出 NEXT_REDIRECT");
    } catch (error) {
      expect(redirectDigest(error)).toMatch(/\/materials\//);
    }
    const count = await prisma.material.count();
    expect(count).toBe(1);
  });

  it("空材料：返回校验错误而不是崩溃", async () => {
    const formData = new FormData();
    formData.set("title", "");
    formData.set("originalText", "   ");
    formData.set("targetLevel", "CET6");
    const result = await generateMaterialAction(undefined, formData);
    expect(result.error).toBeTruthy();
  });
});

describe("addLearningItemAction", () => {
  it("手动加入表达并返回成功", async () => {
    const material = await prisma.material.create({
      data: {
        title: "M",
        originalText: "原文。",
        adaptedText: "She has a good habit. It helps her.",
        targetLevel: "CET6",
        sourceLanguage: "zh",
      },
    });
    const result = await addLearningItemAction({
      materialId: material.id,
      text: "good habit",
      itemType: "phrase",
    });
    expect(result.success).toBe(true);
    const count = await prisma.learningItem.count({ where: { materialId: material.id } });
    expect(count).toBe(1);
  });

  it("重复表达返回错误", async () => {
    const material = await prisma.material.create({
      data: {
        title: "M",
        originalText: "原文。",
        adaptedText: "She has a good habit.",
        targetLevel: "CET6",
        sourceLanguage: "zh",
      },
    });
    await addLearningItemAction({ materialId: material.id, text: "habit", itemType: "word" });
    const result = await addLearningItemAction({
      materialId: material.id,
      text: "Habit",
      itemType: "word",
    });
    expect(result.error).toMatch(/已经在学习库中/);
  });
});

describe("updateLearningItemAction / deleteLearningItemAction", () => {
  it("更新并删除条目", async () => {
    const material = await prisma.material.create({
      data: {
        title: "M",
        originalText: "原文。",
        adaptedText: "She has a good habit.",
        targetLevel: "CET6",
        sourceLanguage: "zh",
      },
    });
    const item = await prisma.learningItem.create({
      data: {
        materialId: material.id,
        text: "habit",
        normalizedText: "habit",
        itemType: "word",
        sourceType: "manual",
        sortOrder: 0,
      },
    });

    const updateResult = await updateLearningItemAction({
      id: item.id,
      meaningZh: "习惯",
      writingUsage: "Example: Build a good habit.",
      notes: "每天",
    });
    expect(updateResult.success).toBe(true);

    const deleteResult = await deleteLearningItemAction({ id: item.id });
    expect(deleteResult.success).toBe(true);
    const count = await prisma.learningItem.count({ where: { id: item.id } });
    expect(count).toBe(0);
  });
});