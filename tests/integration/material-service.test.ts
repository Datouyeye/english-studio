import { beforeEach, describe, expect, it } from "vitest";
import { generateMaterial, getMaterialWithItems, listRecentMaterials } from "@/services/material-service";
import { cleanDatabase } from "../helpers/cleanup";

beforeEach(async () => {
  await cleanDatabase();
});

describe("generateMaterial", () => {
  it("使用 Mock AI 生成并保存材料与推荐条目（含写作示例）", async () => {
    process.env.MOCK_AI = "1";
    const { id } = await generateMaterial({
      title: "",
      originalText: "早睡早起对身体好。",
      targetLevel: "CET6",
    });
    const material = await getMaterialWithItems(id);
    expect(material.title).toBeTruthy();
    expect(material.adaptedText.length).toBeGreaterThan(0);
    expect(material.targetLevel).toBe("CET6");
    expect(material.learningItems.length).toBeGreaterThan(0);
    expect(material.learningItems.length).toBeLessThanOrEqual(15);
    expect(material.learningItems.every((item) => item.sourceType === "ai")).toBe(true);
    expect(material.learningItems[0].writingUsage).toBeTruthy();
  });

  it("用户提供的标题优先", async () => {
    process.env.MOCK_AI = "1";
    const { id } = await generateMaterial({
      title: "我的标题",
      originalText: "运动有益健康。",
      targetLevel: "CET4",
    });
    const material = await getMaterialWithItems(id);
    expect(material.title).toBe("我的标题");
  });

  it("最近材料列表按时间倒序", async () => {
    process.env.MOCK_AI = "1";
    await generateMaterial({ title: "a", originalText: "第一份材料内容。", targetLevel: "CET6" });
    await generateMaterial({ title: "b", originalText: "第二份材料内容。", targetLevel: "CET6" });
    const list = await listRecentMaterials();
    expect(list.length).toBe(2);
    expect(list[0].title).toBe("b");
  });
});