"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import { addUserSentences, judgeTranslation } from "@/services/practice-service";
import { normalizeText } from "@/lib/text";
import { prisma } from "@/lib/db";

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
