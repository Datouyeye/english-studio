import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import {
  addManualLearningItem,
  deleteLearningItem,
  listItemsForReview,
  listLearningItems,
  updateLearningItem,
} from "@/services/learning-item-service";
import { cleanDatabase } from "../helpers/cleanup";

async function createMaterial() {
  return prisma.material.create({
    data: {
      title: "Test Material",
      originalText: "原文内容。",
      adaptedText: "She has a good habit. It helps her every day.",
      targetLevel: "CET6",
      sourceLanguage: "zh",
    },
  });
}

beforeEach(async () => {
  await cleanDatabase();
});

describe("addManualLearningItem", () => {
  it("加入手动条目并自动生成来源例句与写作示例", async () => {
    process.env.MOCK_AI = "1";
    const material = await createMaterial();
    const item = await addManualLearningItem({
      materialId: material.id,
      text: "habit",
      itemType: "word",
    });
    expect(item.sourceType).toBe("manual");
    expect(item.sourceSentence).toContain("habit");
    expect(item.meaningZh).toBeTruthy(); // Mock AI 生成了释义
    expect(item.writingUsage).toBeTruthy(); // Mock AI 生成了写作示例
  });

  it("同材料内重复表达被拒绝", async () => {
    process.env.MOCK_AI = "1";
    const material = await createMaterial();
    await addManualLearningItem({ materialId: material.id, text: "habit", itemType: "word" });
    await expect(
      addManualLearningItem({ materialId: material.id, text: "Habit", itemType: "word" }),
    ).rejects.toThrow(AppError);
  });
});

describe("updateLearningItem", () => {
  it("可修改释义、写作示例与笔记", async () => {
    process.env.MOCK_AI = "1";
    const material = await createMaterial();
    const item = await addManualLearningItem({ materialId: material.id, text: "habit", itemType: "word" });
    const updated = await updateLearningItem({
      id: item.id,
      meaningZh: "好习惯",
      writingUsage: "Example: Build a good habit first.",
      notes: "每天坚持",
    });
    expect(updated.meaningZh).toBe("好习惯");
    expect(updated.writingUsage).toContain("good habit");
    expect(updated.notes).toBe("每天坚持");
  });
});

describe("deleteLearningItem", () => {
  it("删除条目", async () => {
    process.env.MOCK_AI = "1";
    const material = await createMaterial();
    const item = await addManualLearningItem({ materialId: material.id, text: "habit", itemType: "word" });
    await deleteLearningItem(item.id);
    const count = await prisma.learningItem.count({ where: { id: item.id } });
    expect(count).toBe(0);
  });
});

describe("listLearningItems", () => {
  it("支持搜索与按材料筛选", async () => {
    process.env.MOCK_AI = "1";
    const material = await createMaterial();
    await addManualLearningItem({ materialId: material.id, text: "habit", itemType: "word" });
    await addManualLearningItem({ materialId: material.id, text: "balanced breakfast", itemType: "phrase" });

    const all = await listLearningItems();
    expect(all.length).toBe(2);

    const searched = await listLearningItems({ search: "breakfast" });
    expect(searched.length).toBe(1);
    expect(searched[0].text).toBe("balanced breakfast");

    const filtered = await listLearningItems({ materialId: material.id });
    expect(filtered.length).toBe(2);
  });
});

describe("listItemsForReview", () => {
  it("newest 模式按创建时间倒序", async () => {
    process.env.MOCK_AI = "1";
    const material = await createMaterial();
    await addManualLearningItem({ materialId: material.id, text: "habit", itemType: "word" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await addManualLearningItem({ materialId: material.id, text: "balanced breakfast", itemType: "phrase" });
    const items = await listItemsForReview("newest");
    expect(items.length).toBe(2);
    expect(items[0].text).toBe("balanced breakfast");
  });

  it("random 模式返回相同集合", async () => {
    process.env.MOCK_AI = "1";
    const material = await createMaterial();
    await addManualLearningItem({ materialId: material.id, text: "habit", itemType: "word" });
    await addManualLearningItem({ materialId: material.id, text: "balanced breakfast", itemType: "phrase" });
    const items = await listItemsForReview("random");
    expect(items.length).toBe(2);
  });
});