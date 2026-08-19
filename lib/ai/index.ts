import "server-only";
import { OpenAIProvider } from "./openai";
import { MockAIProvider } from "./mock";
import type { AIProvider } from "./types";
import { AIProviderConfigError } from "./errors";
import { DEFAULT_MODEL } from "./constants";

/** DeepSeek 官方 API 地址。 */
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/**
 * 返回 AI Provider。
 * - 仅当显式设置 MOCK_AI=1 时使用 Mock（测试/演示用，非正式）。
 * - 正式运行时缺少 DEEPSEEK_API_KEY 抛出清晰的配置错误。
 * - 默认指向 DeepSeek；也可通过 DEEPSEEK_BASE_URL 指向其他 OpenAI 兼容服务。
 */
export function getAIProvider(): AIProvider {
  if (process.env.MOCK_AI === "1") {
    return new MockAIProvider();
  }
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new AIProviderConfigError(
      "未配置 DEEPSEEK_API_KEY。请在项目根目录的 .env 文件中设置 DEEPSEEK_API_KEY（参考 .env.example），然后重启开发服务器。",
    );
  }
  return new OpenAIProvider({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL,
    model: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL,
  });
}