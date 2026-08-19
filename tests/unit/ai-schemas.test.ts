import { describe, expect, it } from "vitest";
import {
  adaptedMaterialOutputSchema,
  explanationOutputSchema,
  learningItemOutputSchema,
} from "@/lib/ai/schemas";

const validItem = {
  text: "balanced breakfast",
  itemType: "phrase",
  meaningZh: "营养均衡的早餐",
  explanationEn: "a morning meal with the right mix of foods",
  writingUsage: "Example: A balanced breakfast helps you stay healthy. Use it in essays about lifestyle.",
  sourceSentence: "Enjoy a balanced breakfast every day.",
};

describe("learningItemOutputSchema", () => {
  it("接受合法条目", () => {
    expect(learningItemOutputSchema.safeParse(validItem).success).toBe(true);
  });

  it("拒绝空 text", () => {
    const result = learningItemOutputSchema.safeParse({ ...validItem, text: " " });
    expect(result.success).toBe(false);
  });

  it("拒绝非法 itemType", () => {
    const result = learningItemOutputSchema.safeParse({ ...validItem, itemType: "clause" });
    expect(result.success).toBe(false);
  });

  it("缺少 writingUsage 时拒绝", () => {
    const rest = { ...validItem } as Record<string, unknown>;
    delete rest.writingUsage;
    expect(learningItemOutputSchema.safeParse(rest).success).toBe(false);
  });
});

describe("adaptedMaterialOutputSchema", () => {
  it("接受合法输出", () => {
    const output = {
      title: "A Healthy Morning Routine",
      adaptedText:
        "Starting the day with a glass of warm water is a simple habit. Then enjoy a balanced breakfast with protein, fruit, and grains.",
      detectedSourceLanguage: "zh",
      learningItems: [validItem],
    };
    expect(adaptedMaterialOutputSchema.safeParse(output).success).toBe(true);
  });

  it("拒绝超过 15 条的推荐", () => {
    const items = Array.from({ length: 16 }, (_, i) => ({
      ...validItem,
      text: `word ${i}`,
      sourceSentence: `Sentence with word ${i}.`,
    }));
    const result = adaptedMaterialOutputSchema.safeParse({
      title: "T",
      adaptedText: "A sufficiently long adapted text for the article.",
      detectedSourceLanguage: "en",
      learningItems: items,
    });
    expect(result.success).toBe(false);
  });
});

describe("explanationOutputSchema", () => {
  it("接受合法释义（含写作示例）", () => {
    expect(
      explanationOutputSchema.safeParse({
        meaningZh: "习惯",
        explanationEn: "something you do regularly",
        writingUsage: "Example: Developing a habit takes time.",
      }).success,
    ).toBe(true);
  });
});