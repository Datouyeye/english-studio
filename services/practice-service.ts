import { getAIProvider } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { PracticeScene, PracticeSentenceItem, TranslationJudgement } from "@/lib/ai/schemas";

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
 * 核心生成逻辑：调用 AI 生成 count 条题目，去重后入库（sourceType=ai），
 * 返回实际新增条数。zhText 唯一约束冲突的条目自动跳过。
 */
async function generateAndInsertSentences(count: number): Promise<number> {
  if (count <= 0) return 0;
  const existingRows = await prisma.practiceSentence.findMany({ select: { zhText: true } });
  const existingTexts = existingRows.map((r) => r.zhText);

  const provider = getAIProvider();
  const items = await provider.generatePracticeSentences({ count, existingTexts });

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

/**
 * 保证当天题库数量：当天 00:00 之后生成的题目不足 DAILY_SENTENCE_COUNT 条时，
 * 调用 AI 补足到该数量（首次运行会生成 10 条），返回本次新增条数。
 */
export async function ensureDailySentences(): Promise<number> {
  const todayCount = await countTodaySentences();
  if (todayCount >= DAILY_SENTENCE_COUNT) return 0;
  return generateAndInsertSentences(DAILY_SENTENCE_COUNT - todayCount);
}

/**
 * 手动追加题目：不受"每日 10 条"上限约束，直接再生成 count 条入库。
 * 用于练习页"增加题目"按钮，返回本次实际新增条数。
 */
export async function addMoreSentences(count = DAILY_SENTENCE_COUNT): Promise<number> {
  return generateAndInsertSentences(count);
}

/** 今天（本地时区 00:00 起）已入库的题目条数。 */
export async function countTodaySentences(): Promise<number> {
  return prisma.practiceSentence.count({
    where: { createdAt: { gte: startOfToday() } },
  });
}

export interface PracticePageData {
  sentences: PracticeSentenceListItem[];
  /** 今日新增条数（用于状态提示模块）。 */
  todayCount: number;
  /** 题库总条数。 */
  totalCount: number;
}

/**
 * 练习页数据入口（P1-1 降级设计）：
 * 先取已有题目立即返回，再尝试 AI 补题；补题失败/超时/未配 Key 时静默降级，
 * 只影响"今日新增条数"，绝不让 AI 故障挡住整个页面。
 */
export async function preparePracticePage(limit = 20): Promise<PracticePageData> {
  const [sentences, todayCount, totalCount] = await Promise.all([
    listPracticeSentences(limit),
    countTodaySentences(),
    prisma.practiceSentence.count(),
  ]);

  try {
    await ensureDailySentences();
  } catch (error) {
    // 静默降级：仅记录，不影响页面展示已有题目
    console.error("[practice] 补题失败，已降级为展示已有题目：", error);
  }

  return {
    sentences: await listPracticeSentences(limit),
    todayCount: await countTodaySentences(),
    totalCount,
  };
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

export interface AddUserSentencesResult {
  /** 成功入库的条数。 */
  inserted: number;
  /** 因重复被跳过的条目（含已有题库中相同的中文）。 */
  skipped: PracticeSentenceItem[];
  /** AI 加工后的完整条目列表（入库的 + 跳过的）。 */
  items: PracticeSentenceItem[];
}

/**
 * 用户自定义题目：把用户输入的一段中文交给 AI 识别场景、拆分长句、润色表达，
 * 并生成地道英文参考译文，去重后加入题库（sourceType=manual）。
 */
export async function addUserSentences(rawText: string): Promise<AddUserSentencesResult> {
  const text = rawText.trim();
  if (!text) {
    throw new AppError("请输入需要加工的中文内容", "EMPTY_USER_TEXT");
  }

  const existingRows = await prisma.practiceSentence.findMany({ select: { zhText: true } });
  const existingTexts = existingRows.map((r) => r.zhText);

  const provider = getAIProvider();
  const items = await provider.refineUserSentences({ text, existingTexts });

  let inserted = 0;
  const skipped: PracticeSentenceItem[] = [];
  for (const item of items) {
    const zhText = item.zhText.trim();
    if (!zhText) continue;
    try {
      await prisma.practiceSentence.create({
        data: {
          zhText,
          enReference: item.enReference.trim(),
          scene: item.scene,
          sourceType: "manual",
        },
      });
      inserted += 1;
    } catch (error) {
      // zhText 唯一约束冲突 → 与已有题目重复，跳过
      if (isUniqueConstraintError(error)) {
        skipped.push(item);
        continue;
      }
      throw error;
    }
  }
  return { inserted, skipped, items };
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
