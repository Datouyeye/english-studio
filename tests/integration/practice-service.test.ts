import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  DAILY_SENTENCE_COUNT,
  addMoreSentences,
  countTodaySentences,
  ensureDailySentences,
  getSentenceWithReference,
  judgeTranslation,
  listPracticeSentences,
  listTranslationAttempts,
  listUnansweredSentences,
  preparePracticePage,
  skipSentence,
} from "@/services/practice-service";
import { cleanDatabase } from "../helpers/cleanup";

// 隔离"页面里配置的 AI Key"（ai-config.json），保证"无 Key 时降级"的用例可复现
vi.mock("@/lib/ai-config", () => ({
  readAIConfig: () => null,
  writeAIConfig: vi.fn(),
  clearAIConfig: vi.fn(),
}));

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

describe("countTodaySentences / addMoreSentences（今日统计与手动加题）", () => {
  it("countTodaySentences 初始为 0，补题后等于 10", async () => {
    expect(await countTodaySentences()).toBe(0);
    await ensureDailySentences();
    expect(await countTodaySentences()).toBe(DAILY_SENTENCE_COUNT);
  });

  it("addMoreSentences 不受每日上限约束，可再追加题目", async () => {
    await ensureDailySentences();
    expect(await countTodaySentences()).toBe(DAILY_SENTENCE_COUNT);

    const added = await addMoreSentences(10);
    expect(added).toBe(10);
    expect(await countTodaySentences()).toBe(DAILY_SENTENCE_COUNT * 2);
  });

  it("手动加题不产生重复题目（zhText 唯一）", async () => {
    await ensureDailySentences();
    await addMoreSentences(10);
    const rows = await prisma.practiceSentence.findMany({ select: { zhText: true } });
    expect(new Set(rows.map((r) => r.zhText)).size).toBe(rows.length);
  });
});

describe("preparePracticePage（页面降级入口）", () => {
  it("正常时返回题目列表与今日条数", async () => {
    await ensureDailySentences();
    const data = await preparePracticePage(10);
    expect(data.sentences.length).toBeGreaterThan(0);
    expect(data.todayCount).toBe(DAILY_SENTENCE_COUNT);
    expect(data.totalCount).toBeGreaterThanOrEqual(DAILY_SENTENCE_COUNT);
  });

  it("AI 不可用（无 Key/请求失败）时静默降级，不抛错且照常返回已有题目", async () => {
    // 先造一批已有题目（绕过 AI 补题）
    await prisma.practiceSentence.createMany({
      data: [
        { zhText: "已有题目一：我认为持续学习比天赋更重要。", enReference: "I believe continuous learning matters more than talent.", scene: "life" },
        { zhText: "已有题目二：汇报工作时要先说结论，再说过程。", enReference: "When reporting, state the conclusion first, then the process.", scene: "work" },
      ],
    });

    // 让 AI 失败：既不 mock，也无 API key → getAIProvider 抛配置错误
    delete process.env.MOCK_AI;
    delete process.env.DEEPSEEK_API_KEY;

    const data = await preparePracticePage(10);
    expect(data.sentences.length).toBe(2); // 已有题目照常返回
    expect(data.todayCount).toBe(2); // 补题失败，今日条数保持不变（无新增）
    expect(data.totalCount).toBe(2);
  });
});

describe("翻译历史与未答题排除（TranslationAttempt）", () => {
  it("判定后自动保存记录：题目 + 我的答案 + 标准答案", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(1);
    const detail = await getSentenceWithReference(list[0].id);

    await judgeTranslation(detail.id, detail.enReference);

    const attempts = await prisma.translationAttempt.findMany();
    expect(attempts.length).toBe(1);
    expect(attempts[0].sentenceId).toBe(detail.id);
    expect(attempts[0].zhText).toBe(detail.zhText);
    expect(attempts[0].userTranslation).toBe(detail.enReference);
    expect(attempts[0].referenceTranslation).toBe(detail.enReference);
    expect(attempts[0].passed).toBe(true);
  });

  it("重试同题会覆盖记录（保留最后一版答案）", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(1);
    const detail = await getSentenceWithReference(list[0].id);

    await judgeTranslation(detail.id, "first bad version ??");
    await judgeTranslation(detail.id, detail.enReference);

    const attempts = await prisma.translationAttempt.findMany();
    expect(attempts.length).toBe(1); // 不产生新记录
    expect(attempts[0].userTranslation).toBe(detail.enReference); // 最后一版覆盖
  });

  it("答过的题从练习列表排除（答过的不再出现）", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(10);
    const first = await getSentenceWithReference(list[0].id);

    // 答第 1 题后，未答列表里不应再包含它
    await judgeTranslation(first.id, first.enReference);

    const unanswered = await listUnansweredSentences(20);
    expect(unanswered.some((s) => s.id === first.id)).toBe(false);
    expect(unanswered.length).toBe(list.length - 1);
  });

  it("翻译历史列表按更新时间倒序返回", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(2);
    const a = await getSentenceWithReference(list[0].id);
    const b = await getSentenceWithReference(list[1].id);

    await judgeTranslation(a.id, a.enReference);
    await judgeTranslation(b.id, b.enReference);

    const history = await listTranslationAttempts();
    expect(history.length).toBe(2);
    expect(history[0].sentenceId).toBe(b.id); // 后答的在前
  });

  it("跳过一题后不再出现在练习列表（相当于删除）", async () => {
    await ensureDailySentences();
    const list = await listPracticeSentences(10);
    const target = list[0];

    await skipSentence(target.id);

    const unanswered = await listUnansweredSentences(20);
    expect(unanswered.some((s) => s.id === target.id)).toBe(false);
    expect(unanswered.length).toBe(list.length - 1);
  });
});
