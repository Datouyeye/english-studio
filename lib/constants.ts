export const LIMITS = {
  /** 原始材料最大字符数 */
  originalTextMax: 20_000,
  /** 标题最大字符数 */
  titleMax: 200,
  /** 学习条目 text 最大长度 */
  itemTextMax: 200,
  /** 中文释义最大长度 */
  meaningZhMax: 500,
  /** 英文解释最大长度 */
  explanationEnMax: 1_000,
  /** 写作示例最大长度 */
  writingUsageMax: 500,
  /** 来源例句最大长度 */
  sourceSentenceMax: 2_000,
  /** 笔记最大长度 */
  notesMax: 2_000,
  /** 上传文件大小上限（字节） */
  fileSizeMax: 15 * 1024 * 1024,
} as const;

export const TARGET_LEVELS = ["CET4", "CET6", "IELTS"] as const;
export type TargetLevel = (typeof TARGET_LEVELS)[number];

/** 等级显示名 */
export const LEVEL_LABELS: Record<TargetLevel, string> = {
  CET4: "四级",
  CET6: "六级",
  IELTS: "雅思",
};

export const ITEM_TYPES = ["word", "phrase", "sentence"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const SOURCE_LANGUAGES = ["zh", "en", "other"] as const;
export type SourceLanguage = (typeof SOURCE_LANGUAGES)[number];

/** AI 推荐条目数量上限（随文章长度变化，见 AI 提示词） */
export const MAX_LEARNING_ITEMS = 15;