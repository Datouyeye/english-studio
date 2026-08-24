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

export interface SaveAttemptInput {
  sentenceId: string;
  zhText: string;
  userTranslation: string;
  referenceTranslation: string;
  score: number;
  passed: boolean;
  feedback: string;
}

/**
 * 保存/更新一条翻译练习记录（每题只保留最后一条，按 sentenceId 覆盖）。
 * 用于学习库「翻译历史」回溯，以及练习页"答过的题不再出现"的判定依据。
 */
export async function saveTranslationAttempt(input: SaveAttemptInput): Promise<void> {
  await prisma.translationAttempt.upsert({
    where: { sentenceId: input.sentenceId },
    update: {
      userTranslation: input.userTranslation,
      score: input.score,
      passed: input.passed,
      feedback: input.feedback,
    },
    create: input,
  });
}

/** 已答过的题目 ID 集合（有练习记录 = 答过）。 */
async function answeredSentenceIds(): Promise<Set<string>> {
  const rows = await prisma.translationAttempt.findMany({ select: { sentenceId: true } });
  return new Set(rows.map((r) => r.sentenceId));
}

/**
 * 练习取题：排除已答过的题目（有记录 = 答过）和被跳过的题目，返回未答题列表。
 * 这样"答过的题不再保留"，离开再回来也会接着未答的题继续。
 */
export async function listUnansweredSentences(limit = 20): Promise<PracticeSentenceListItem[]> {
  const answered = await answeredSentenceIds();
  const rows = await prisma.practiceSentence.findMany({
    where: { skipped: false },
    orderBy: { createdAt: "desc" },
    take: Math.max(limit * 3, 60),
    select: { id: true, zhText: true, scene: true, createdAt: true },
  });
  return rows.filter((r) => !answered.has(r.id)).slice(0, limit);
}

/** 跳过一题：标记为 skipped，之后不再出现在练习列表（相当于删除）。 */
export async function skipSentence(sentenceId: string): Promise<void> {
  const sentence = await prisma.practiceSentence.findUnique({
    where: { id: sentenceId },
    select: { id: true },
  });
  if (!sentence) {
    throw new AppError("题目不存在或已被删除", "PRACTICE_SENTENCE_NOT_FOUND");
  }
  await prisma.practiceSentence.update({
    where: { id: sentenceId },
    data: { skipped: true },
  });
}

/** 历史翻译记录（学习库「翻译历史」用），最新在前。 */
export async function listTranslationAttempts(limit = 50) {
  return prisma.translationAttempt.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export interface PracticePageData {
  sentences: PracticeSentenceListItem[];
  /** 今日新增条数（用于状态提示模块）。 */
  todayCount: number;
  /** 题库总条数。 */
  totalCount: number;
  /** 已答过的题数。 */
  answeredCount: number;
  /** 已处理题数（答过 + 跳过），用于"第 X / N 题"的进度显示。 */
  processedCount: number;
}

/**
 * 练习页数据入口（P1-1 降级设计）：
 * 先取已有题目立即返回，再尝试 AI 补题；补题失败/超时/未配 Key 时静默降级，
 * 只影响"今日新增条数"，绝不让 AI 故障挡住整个页面。
 */
export async function preparePracticePage(limit = 20): Promise<PracticePageData> {
  const [sentences, todayCount, totalCount, answeredCount, skippedCount] = await Promise.all([
    listUnansweredSentences(limit),
    countTodaySentences(),
    prisma.practiceSentence.count(),
    prisma.translationAttempt.count(),
    prisma.practiceSentence.count({ where: { skipped: true } }),
  ]);

  try {
    await ensureDailySentences();
  } catch (error) {
    // 静默降级：仅记录，不影响页面展示已有题目
    console.error("[practice] 补题失败，已降级为展示已有题目：", error);
  }

  return {
    sentences: await listUnansweredSentences(limit),
    todayCount: await countTodaySentences(),
    totalCount,
    answeredCount,
    processedCount: answeredCount + skippedCount,
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
 * - 判定完成后自动保存练习记录（题目 + 用户最后一版答案 + 标准答案），
 *   供学习库「翻译历史」回溯，并标记该题"已答过"。
 */
export async function judgeTranslation(
  sentenceId: string,
  userTranslation: string,
): Promise<JudgeTranslationResult> {
  const sentence = await getSentenceWithReference(sentenceId);
  const provider = getAIProvider();
  const trimmed = userTranslation.trim();
  const judgement = await provider.judgeTranslation({
    zhText: sentence.zhText,
    userTranslation: trimmed,
    referenceTranslation: sentence.enReference,
  });
  const result: JudgeTranslationResult = {
    ...judgement,
    referenceTranslation: sentence.enReference,
  };

  try {
    await saveTranslationAttempt({
      sentenceId,
      zhText: sentence.zhText,
      userTranslation: trimmed,
      referenceTranslation: sentence.enReference,
      score: judgement.score,
      passed: judgement.passed,
      feedback: judgement.feedback,
    });
  } catch (error) {
    // 记录保存失败不应阻断判定结果返回，只记日志
    console.error("[practice] 保存练习记录失败：", error);
  }

  return result;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
