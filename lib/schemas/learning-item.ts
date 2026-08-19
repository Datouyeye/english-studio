import { z } from "zod";
import { ITEM_TYPES, LIMITS } from "../constants";

export const addLearningItemInputSchema = z.object({
  materialId: z.string().min(1, "缺少材料 ID"),
  text: z
    .string()
    .trim()
    .min(1, "请先在阅读页选中文本")
    .max(LIMITS.itemTextMax, `选中文本不能超过 ${LIMITS.itemTextMax} 字符`),
  itemType: z.enum(ITEM_TYPES).default("word"),
  notes: z.string().trim().max(LIMITS.notesMax, `笔记不能超过 ${LIMITS.notesMax} 字符`).optional(),
});
export type AddLearningItemInput = z.input<typeof addLearningItemInputSchema>;

export const updateLearningItemInputSchema = z.object({
  id: z.string().min(1, "缺少条目 ID"),
  meaningZh: z.string().trim().max(LIMITS.meaningZhMax, `释义不能超过 ${LIMITS.meaningZhMax} 字符`).optional(),
  explanationEn: z.string().trim().max(LIMITS.explanationEnMax, `解释不能超过 ${LIMITS.explanationEnMax} 字符`).optional(),
  writingUsage: z.string().trim().max(LIMITS.writingUsageMax, `写作示例不能超过 ${LIMITS.writingUsageMax} 字符`).optional(),
  notes: z.string().trim().max(LIMITS.notesMax, `笔记不能超过 ${LIMITS.notesMax} 字符`).optional(),
});
export type UpdateLearningItemInput = z.input<typeof updateLearningItemInputSchema>;

export const deleteLearningItemInputSchema = z.object({
  id: z.string().min(1, "缺少条目 ID"),
});
export type DeleteLearningItemInput = z.infer<typeof deleteLearningItemInputSchema>;