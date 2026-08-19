import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  DAILY_SENTENCE_COUNT,
  ensureDailySentences,
  getSentenceWithReference,
  judgeTranslation,
  listPracticeSentences,
} from "@/services/practice-service";
import { cleanDatabase } from "../helpers/cleanup";

beforeEach(async () => {
  await cleanDatabase();
  process.env.MOCK_AI = "1";
});

describe("ensureDailySentences（每日题库自动补充）", () => {
  it("首次调用生成 10 条题目入库", async () => {
    const added = await ensureDailySentences();
    expect(added).toBe(DAILY_SENTENCE_COUNT);
    const count = await prisma.practiceSentence.count();
    expect(count).toBe(DAILY_SENTENCE_COUNT);
  });

  it("当天已满 10 条时再次调用不重复生成", async () => {
    await ensureDailySentences();
    const addedAgain = await ensureDailySentences();
    expect(addedAgain).toBe(0);
    const count = await prisma.practiceSentence.count();
    expect(count).toBe(DAILY_SENTENCE_COUNT);
  });

  it("题目场景覆盖 work 与 life", async () => {
    await ensureDailySentences();
    const scenes = await prisma.practiceSentence.findMany({ select: { scene: true } });
    const set = new Set(scenes.map((s) => s.scene));
    expect(set.has("work")).toBe(true);
    expect(set.has("life")).toBe(true);
  });

  it("zhText 不重复（唯一约束）", async () => {
    await ensureDailySentences();
    const rows = await prisma.practiceSentence.findMany({ select: { zhText: true } });
    const unique = new Set(rows.map((r) => r.zhText));
    expect(unique.size).toBe(rows.length);
  });
});

describe("listPracticeSentences / getSentenceWithReference（答案防偷看）", () => {
  it("列表接口不返回参考答案", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(20);
    expect(list.length).toBeGreaterThan(0);
    for (const item of list) {
      expect(item).not.toHaveProperty("enReference");
      expect(item.zhText).toBeTruthy();
      expect(["work", "life"]).toContain(item.scene);
    }
  });

  it("单题详情接口返回参考答案（用户主动查看时用）", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(1);
    const detail = await getSentenceWithReference(list[0].id);
    expect(detail.enReference.length).toBeGreaterThan(0);
  });

  it("不存在的题目抛出可读错误", async () => {
    await expect(getSentenceWithReference("not-exist-id")).rejects.toThrow("题目不存在");
  });
});

describe("judgeTranslation（完成度判定）", () => {
  it("语义完整、语法正确的翻译通过判定，并随结果返回参考答案", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(1);
    const detail = await getSentenceWithReference(list[0].id);

    // Mock 判定：完整对照参考译文 → 通过
    const result = await judgeTranslation(detail.id, detail.enReference);
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.feedback.length).toBeGreaterThan(0);
    expect(result.referenceTranslation).toBe(detail.enReference);
    expect(result).toHaveProperty("suggestions");
  });

  it("质量较差的翻译不通过，但结果结构保留（前端可自由选择重试或下一题）", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(1);
    const result = await judgeTranslation(list[0].id, "bad grammar translation ??");
    expect(typeof result.passed).toBe("boolean");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(5);
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it("判定的参考译文只在该次结果中出现（不污染列表接口）", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(20);
    await judgeTranslation(list[0].id, list[0].zhText);
    const listAfter = await listPracticeSentences(20);
    expect(listAfter[0]).not.toHaveProperty("referenceTranslation");
  });
});
