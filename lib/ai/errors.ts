import { AppError } from "../errors";

/** AI 层错误基类。 */
export class AIError extends AppError {}

/** 缺少 API Key 等配置错误。 */
export class AIProviderConfigError extends AIError {
  constructor(message: string) {
    super(message, "AI_CONFIG_ERROR");
    this.name = "AIProviderConfigError";
  }
}

/** 调用 AI 服务失败（网络、限流、服务端错误）。 */
export class AIRequestError extends AIError {
  constructor(operation: string, detail: string) {
    super(`AI 请求失败（${operation}）：${detail}`, "AI_REQUEST_ERROR");
    this.name = "AIRequestError";
  }
}

/** AI 返回内容不符合结构化输出要求。 */
export class AIOutputError extends AIError {
  constructor(operation: string, detail: string) {
    super(`AI 返回内容不符合要求（${operation}）：${detail}`, "AI_OUTPUT_ERROR");
    this.name = "AIOutputError";
  }
}