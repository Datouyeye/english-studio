import { getAIProvider } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { PracticeScene, TranslationJudgement } from "@/lib/ai/schemas";

/** 每天自动补充的新题目数量。 */
export const DAILY_SENTENCE_COUNT = 10;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** 题库列表条目（不含参考答案，防止用户提前偷看）。 */
export type PracticeSentenceListItem = {
  id: string;
  zhText: string;
  scene: PracticeScene;
  createdAt: Date;
};

/**
 * 保证当天题库数量：当天 00:00 之后生成的题目不足 DAILY_SENTENCE_COUNT 条时，
 * 调用 AI 补足到该数量（首次运行会生成 10 条），返回本次新增条数。
 */
export async function ensureDailySentences(): Promise<number> {
  const since = startOfToday();
  const todayCount = await prisma.practiceSentence.count({
    where: { createdAt: { gte: since } },
  });
  if (todayCount >= DAILY_SENTENCE_COUNT) return 0;

  const need = DAILY_SENTENCE_COUNT - todayCount;
  const existingRows = await prisma.practiceSentence.findMany({
    select: { zhText: true },
  });
  const existingTexts = existingRows.map((r) => r.zhText);

  const provider = getAIProvider();
  const items = await provider.generatePracticeSentences({
    count: need,
    existingTexts,
  });

  let inserted = 0;
  for (const item of items) {
    const zhText = item.zhText.trim();
    if (!zhText) continue;
    try {
      await prisma.practiceSentence.create({
        data: {
          zhText,
          enReference: item.enReference.trim(),
          scene: item.scene,
          sourceType: "ai",
        },
      });
      inserted += 1;
    } catch (error) {
      // zhText 唯一约束冲突 → 与已有题目重复，跳过
      if (isUniqueConstraintError(error)) continue;
      throw error;
    }
  }
  return inserted;
}

/** 列出练习题目（不含参考答案）。默认返回最新题目在前，供练习页取用。 */
export async function listPracticeSentences(limit = 20): Promise<PracticeSentenceListItem[]> {
  const rows = await prisma.practiceSentence.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, zhText: true, scene: true, createdAt: true },
  });
  return rows;
}

/** 获取单题的完整信息（含参考答案）。用于用户主动点击「查看答案」时。 */
export async function getSentenceWithReference(id: string) {
  const sentence = await prisma.practiceSentence.findUnique({ where: { id } });
  if (!sentence) {
    throw new AppError("题目不存在或已被删除", "PRACTICE_SENTENCE_NOT_FOUND");
  }
  return sentence;
}

export interface JudgeTranslationResult extends TranslationJudgement {
  referenceTranslation: string;
}

/**
 * 判定用户的中译英完成度。
 * - 参考答案只在判定完成后随结果返回（答案防偷看：判定前不暴露）。
 * - passed=false 时用户可选择重试或直接进入下一题（是否重试由前端决定）。
 */
export async function judgeTranslation(
  sentenceId: string,
  userTranslation: string,
): Promise<JudgeTranslationResult> {
  const sentence = await getSentenceWithReference(sentenceId);
  const provider = getAIProvider();
  const judgement = await provider.judgeTranslation({
    zhText: sentence.zhText,
    userTranslation: userTranslation.trim(),
    referenceTranslation: sentence.enReference,
  });
  return {
    ...judgement,
    referenceTranslation: sentence.enReference,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
