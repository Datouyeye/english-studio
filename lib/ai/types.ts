import type {
  AdaptedMaterialOutput,
  ExplanationOutput,
  ItemType,
  PracticeSentenceItem,
  TargetLevel,
  TranslationJudgement,
} from "./schemas";

export interface GenerateAdaptedMaterialInput {
  originalText: string;
  targetLevel: TargetLevel;
}

export interface ExplainSelectedTextInput {
  text: string;
  itemType: ItemType;
  contextSentence?: string;
}

export interface JudgeTranslationInput {
  zhText: string;
  userTranslation: string;
  referenceTranslation: string;
}

export interface GeneratePracticeSentencesInput {
  /** 本次期望生成的条数（1-10）。 */
  count: number;
  /** 题库已有的中文句子，用于提示模型避免重复。 */
  existingTexts: string[];
}

/**
 * AI 提供方接口。第一版只实现 OpenAI，Mock 仅用于测试。
 * 未来更换模型/服务商时实现该接口并在工厂中替换即可。
 */
export interface AIProvider {
  readonly name: string;
  generateAdaptedMaterial(input: GenerateAdaptedMaterialInput): Promise<AdaptedMaterialOutput>;
  explainSelectedText(input: ExplainSelectedTextInput): Promise<ExplanationOutput>;
  judgeTranslation(input: JudgeTranslationInput): Promise<TranslationJudgement>;
  generatePracticeSentences(input: GeneratePracticeSentencesInput): Promise<PracticeSentenceItem[]>;
}
