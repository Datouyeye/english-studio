import { getAIProvider } from "@/lib/ai";
import { MAX_LEARNING_ITEMS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { GenerateMaterialInput } from "@/lib/schemas/material";
import { containsText, normalizeText } from "@/lib/text";
import type { LearningItemOutput } from "@/lib/ai/schemas";

/**
 * 后处理 AI 推荐：去重、过滤未出现在改写文章中的表达、封顶数量。
 */
function postprocessLearningItems(
  items: LearningItemOutput[],
  adaptedText: string,
): LearningItemOutput[] {
  const seen = new Set<string>();
  const result: LearningItemOutput[] = [];
  for (const item of items) {
    const key = normalizeText(item.text);
    if (!key || seen.has(key)) continue;
    if (!containsText(adaptedText, item.text)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= MAX_LEARNING_ITEMS) break;
  }
  return result;
}

/** 调用 AI 生成改写文章并保存 Material + LearningItems，返回新材料 ID。 */
export async function generateMaterial(input: GenerateMaterialInput): Promise<{ id: string }> {
  const provider = getAIProvider();
  const output = await provider.generateAdaptedMaterial({
    originalText: input.originalText,
    targetLevel: input.targetLevel,
  });

  const items = postprocessLearningItems(output.learningItems, output.adaptedText);
  const title = input.title.trim() || output.title || "无标题";

  const material = await prisma.material.create({
    data: {
      title,
      originalText: input.originalText,
      adaptedText: output.adaptedText,
      targetLevel: input.targetLevel,
      sourceLanguage: output.detectedSourceLanguage,
      learningItems: {
        create: items.map((item, index) => ({
          text: item.text,
          normalizedText: normalizeText(item.text),
          itemType: item.itemType,
          meaningZh: item.meaningZh,
          explanationEn: item.explanationEn,
          writingUsage: item.writingUsage,
          sourceSentence: item.sourceSentence,
          sourceType: "ai",
          sortOrder: index,
        })),
      },
    },
  });
  return { id: material.id };
}

export async function getMaterialWithItems(id: string) {
  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      learningItems: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!material) {
    throw new AppError("材料不存在或已被删除", "MATERIAL_NOT_FOUND");
  }
  return material;
}

export async function listRecentMaterials(limit = 10) {
  return prisma.material.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      targetLevel: true,
      sourceLanguage: true,
      createdAt: true,
    },
  });
}