import { getAIProvider } from "@/lib/ai";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type {
  AddLearningItemInput,
  UpdateLearningItemInput,
} from "@/lib/schemas/learning-item";
import { extractSourceSentence, normalizeText } from "@/lib/text";

/** 手动选中文本加入学习库；AI 释义失败时仍保存（释义留空，可手动编辑）。 */
export async function addManualLearningItem(input: AddLearningItemInput) {
  const material = await prisma.material.findUnique({
    where: { id: input.materialId },
    select: { id: true, adaptedText: true },
  });
  if (!material) {
    throw new AppError("材料不存在或已被删除", "MATERIAL_NOT_FOUND");
  }

  const normalized = normalizeText(input.text);
  const existing = await prisma.learningItem.findUnique({
    where: {
      materialId_normalizedText: {
        materialId: input.materialId,
        normalizedText: normalized,
      },
    },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("该表达已经在学习库中", "DUPLICATE_ITEM");
  }

  const sourceSentence = extractSourceSentence(material.adaptedText, input.text) || "";

  let meaningZh = "";
  let explanationEn = "";
  let writingUsage = "";
  try {
    const provider = getAIProvider();
    const explanation = await provider.explainSelectedText({
      text: input.text,
      itemType: input.itemType ?? "word",
      contextSentence: sourceSentence || undefined,
    });
    meaningZh = explanation.meaningZh;
    explanationEn = explanation.explanationEn;
    writingUsage = explanation.writingUsage;
  } catch {
    // AI 释义失败不阻断主流程，释义留空由用户在学习库编辑。
  }

  return prisma.learningItem.create({
    data: {
      materialId: input.materialId,
      text: input.text,
      normalizedText: normalized,
      itemType: input.itemType ?? "word",
      meaningZh,
      explanationEn,
      writingUsage,
      sourceSentence,
      notes: input.notes ?? "",
      sourceType: "manual",
      sortOrder: 0,
    },
  });
}

export async function updateLearningItem(input: UpdateLearningItemInput) {
  const data: {
    meaningZh?: string;
    explanationEn?: string;
    writingUsage?: string;
    notes?: string;
  } = {};
  if (input.meaningZh !== undefined) data.meaningZh = input.meaningZh;
  if (input.explanationEn !== undefined) data.explanationEn = input.explanationEn;
  if (input.writingUsage !== undefined) data.writingUsage = input.writingUsage;
  if (input.notes !== undefined) data.notes = input.notes;

  try {
    return await prisma.learningItem.update({ where: { id: input.id }, data });
  } catch {
    throw new AppError("学习条目不存在或已被删除", "ITEM_NOT_FOUND");
  }
}

export async function deleteLearningItem(id: string) {
  try {
    await prisma.learningItem.delete({ where: { id } });
  } catch {
    throw new AppError("学习条目不存在或已被删除", "ITEM_NOT_FOUND");
  }
}

export interface ListLearningItemsParams {
  search?: string;
  materialId?: string;
}

export async function listLearningItems(params: ListLearningItemsParams = {}) {
  const where: Record<string, unknown> = {};
  if (params.materialId) {
    where.materialId = params.materialId;
  }
  const search = params.search?.trim();
  if (search) {
    where.OR = [
      { text: { contains: search } },
      { meaningZh: { contains: search } },
      { explanationEn: { contains: search } },
      { writingUsage: { contains: search } },
      { sourceSentence: { contains: search } },
      { notes: { contains: search } },
    ];
  }

  return prisma.learningItem.findMany({
    where,
    include: {
      material: { select: { id: true, title: true, targetLevel: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** 学习库页“按来源文章查看”的筛选选项。 */
export async function listMaterialsForFilter() {
  return prisma.material.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
}

export type ReviewMode = "newest" | "random";

/** 复习条目：newest 按创建时间倒序；random 服务端随机打乱。 */
export async function listItemsForReview(mode: ReviewMode) {
  const items = await prisma.learningItem.findMany({
    include: {
      material: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (mode === "random") {
    return shuffle(items);
  }
  return items;
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}