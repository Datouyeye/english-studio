import { z } from "zod";

export const targetLevelSchema = z.enum(["CET4", "CET6", "IELTS"]);
export type TargetLevel = z.infer<typeof targetLevelSchema>;

export const itemTypeSchema = z.enum(["word", "phrase", "sentence"]);
export type ItemType = z.infer<typeof itemTypeSchema>;

export const sourceLanguageSchema = z.enum(["zh", "en", "other"]);
export type SourceLanguage = z.infer<typeof sourceLanguageSchema>;

export const learningItemOutputSchema = z.object({
  text: z.string().trim().min(1, "text 不能为空").max(120, "text 超过长度限制"),
  itemType: itemTypeSchema,
  meaningZh: z.string().trim().min(1, "meaningZh 不能为空").max(200),
  explanationEn: z.string().trim().min(1, "explanationEn 不能为空").max(300),
  writingUsage: z.string().trim().min(1, "writingUsage 不能为空").max(500),
  sourceSentence: z.string().trim().min(1, "sourceSentence 不能为空").max(1_000),
});
export type LearningItemOutput = z.infer<typeof learningItemOutputSchema>;

export const adaptedMaterialOutputSchema = z.object({
  title: z.string().trim().min(1, "title 不能为空").max(200),
  adaptedText: z.string().trim().min(50, "改写文章过短").max(20_000),
  detectedSourceLanguage: sourceLanguageSchema,
  learningItems: z
    .array(learningItemOutputSchema)
    .min(1, "learningItems 至少 1 项")
    .max(15, "learningItems 最多 15 项"),
});
export type AdaptedMaterialOutput = z.infer<typeof adaptedMaterialOutputSchema>;

export const explanationOutputSchema = z.object({
  meaningZh: z.string().trim().min(1, "meaningZh 不能为空").max(200),
  explanationEn: z.string().trim().min(1, "explanationEn 不能为空").max(300),
  writingUsage: z.string().trim().min(1, "writingUsage 不能为空").max(500),
});
export type ExplanationOutput = z.infer<typeof explanationOutputSchema>;