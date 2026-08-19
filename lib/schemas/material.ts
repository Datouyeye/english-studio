import { z } from "zod";
import { LIMITS, TARGET_LEVELS } from "../constants";

export const generateMaterialInputSchema = z.object({
  title: z.string().trim().max(LIMITS.titleMax, `标题不能超过 ${LIMITS.titleMax} 字符`),
  originalText: z
    .string()
    .trim()
    .min(1, "请输入需要改写的材料")
    .max(LIMITS.originalTextMax, `材料不能超过 ${LIMITS.originalTextMax} 字符`),
  targetLevel: z.enum(TARGET_LEVELS, { message: "请选择目标英语水平" }),
});
export type GenerateMaterialInput = z.infer<typeof generateMaterialInputSchema>;