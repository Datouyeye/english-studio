import type { AdaptedMaterialOutput, ExplanationOutput, ItemType, TargetLevel } from "./schemas";

export interface GenerateAdaptedMaterialInput {
  originalText: string;
  targetLevel: TargetLevel;
}

export interface ExplainSelectedTextInput {
  text: string;
  itemType: ItemType;
  contextSentence?: string;
}

/**
 * AI 提供方接口。第一版只实现 OpenAI，Mock 仅用于测试。
 * 未来更换模型/服务商时实现该接口并在工厂中替换即可。
 */
export interface AIProvider {
  readonly name: string;
  generateAdaptedMaterial(input: GenerateAdaptedMaterialInput): Promise<AdaptedMaterialOutput>;
  explainSelectedText(input: ExplainSelectedTextInput): Promise<ExplanationOutput>;
}