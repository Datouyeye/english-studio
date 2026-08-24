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

export const practiceSceneSchema = z.enum(["work", "life"]);
export type PracticeScene = z.infer<typeof practiceSceneSchema>;

/** 翻译完成度判定结果。passed 为 true 即「完成度高」，不要求与参考译文一致。 */
export const translationJudgementSchema = z.object({
  score: z.number().int().min(0, "score 最小 0").max(5, "score 最大 5"),
  passed: z.boolean(),
  feedback: z.string().trim().min(1, "feedback 不能为空").max(500),
  suggestions: z.array(z.string().trim().min(1).max(300)).max(5, "suggestions 最多 5 条"),
});
export type TranslationJudgement = z.infer<typeof translationJudgementSchema>;

/** 练习页查词结果：帮用户确认"提笔忘词"的表达（支持中文意思或英文输入）。 */
export const lookupWordOutputSchema = z.object({
  word: z.string().trim().min(1, "word 不能为空").max(100),
  meaningZh: z.string().trim().min(1, "meaningZh 不能为空").max(300),
  usage: z.string().trim().min(1, "usage 不能为空").max(500),
  example: z.string().trim().min(1, "example 不能为空").max(300),
});
export type LookupWordOutput = z.infer<typeof lookupWordOutputSchema>;

export const practiceSentenceItemSchema = z.object({
  zhText: z.string().trim().min(1, "zhText 不能为空").max(200, "zhText 超过长度限制"),
  enReference: z.string().trim().min(1, "enReference 不能为空").max(500, "enReference 超过长度限制"),
  scene: practiceSceneSchema,
});
export type PracticeSentenceItem = z.infer<typeof practiceSentenceItemSchema>;

export const practiceSentenceBatchSchema = z.object({
  sentences: z
    .array(practiceSentenceItemSchema)
    .min(1, "至少 1 条")
    .max(10, "最多 10 条"),
});
export type PracticeSentenceBatch = z.infer<typeof practiceSentenceBatchSchema>;