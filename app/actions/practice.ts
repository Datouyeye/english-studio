"use server";

import { revalidatePath } from "next/cache";
import { getAIProvider } from "@/lib/ai";
import { AppError } from "@/lib/errors";
import {
  addMoreSentences,
  addUserSentences,
  countTodaySentences,
  judgeTranslation,
} from "@/services/practice-service";
import { normalizeText } from "@/lib/text";
import { prisma } from "@/lib/db";

export interface LookupWordState {
  success?: boolean;
  error?: string;
  result?: { word: string; meaningZh: string; usage: string; example: string };
}

/** 练习页查词：输入中文意思或英文，返回 AI 确认的地道表达与用法。 */
export async function lookupWordAction(text: string): Promise<LookupWordState> {
  const trimmed = text.trim();
  if (!trimmed) return { error: "请输入想确认的表达。" };
  try {
    const provider = getAIProvider();
    const result = await provider.lookupWord({ text: trimmed });
    return { success: true, result };
  } catch (error) {
    return {
      error:
        error instanceof AppError ? error.message : "查词失败，请检查 API 配置或稍后重试。",
    };
  }
}

export interface JudgePracticeState {
  success?: boolean;
  error?: string;
  result?: {
    score: number;
    passed: boolean;
    feedback: string;
    suggestions: string[];
    referenceTranslation: string;
  };
}

/** 提交翻译并返回 AI 完成度判定（参考答案随判定结果返回）。 */
export async function judgePracticeTranslationAction(
  sentenceId: string,
  userTranslation: string,
): Promise<JudgePracticeState> {
  try {
    const result = await judgeTranslation(sentenceId, userTranslation);
    return { success: true, result };
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "判定失败，请稍后重试。" };
  }
}

export interface AddMoreSentencesState {
  success?: boolean;
  error?: string;
  /** 本次实际新增条数。 */
  added?: number;
  /** 操作后今日累计新增条数。 */
  todayCount?: number;
}

/** 手动追加 10 条题目（不受每日自动补题上限约束），用于练习页"增加题目"按钮。 */
export async function addMoreSentencesAction(): Promise<AddMoreSentencesState> {
  try {
    const added = await addMoreSentences(10);
    const todayCount = await countTodaySentences();
    return { success: true, added, todayCount };
  } catch (error) {
    return {
      error:
        error instanceof AppError ? error.message : "生成题目失败，请稍后重试。",
    };
  }
}

export interface AddUserSentencesState {
  success?: boolean;
  error?: string;
  inserted?: number;
  skipped?: number;
  items?: { zhText: string; enReference: string; scene: string }[];
}

/** 用户自定义题目：输入一段中文 → AI 识别/拆分/润色 → 去重入库。 */
export async function addUserSentencesAction(text: string): Promise<AddUserSentencesState> {
  try {
    const result = await addUserSentences(text);
    return {
      success: true,
      inserted: result.inserted,
      skipped: result.skipped.length,
      items: result.items,
    };
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "加工失败，请稍后重试。" };
  }
}

export interface SavePracticeExpressionState {
  success?: boolean;
  alreadyExists?: boolean;
  error?: string;
}

/** 把练习句的参考表达加入学习库（materialId 为空，独立于材料）。 */
export async function savePracticeExpressionAction(
  zhText: string,
  enReference: string,
): Promise<SavePracticeExpressionState> {
  try {
    const normalized = normalizeText(enReference);
    const existing = await prisma.learningItem.findFirst({
      where: { materialId: null, normalizedText: normalized },
      select: { id: true },
    });
    if (existing) return { success: true, alreadyExists: true };

    await prisma.learningItem.create({
      data: {
        text: enReference,
        normalizedText: normalized,
        itemType: "sentence",
        meaningZh: zhText,
        sourceType: "manual",
        sourceSentence: enReference,
      },
    });
    revalidatePath("/library");
    revalidatePath("/review");
    return { success: true };
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "收藏失败，请稍后重试。" };
  }
}
