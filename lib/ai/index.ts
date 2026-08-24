import "server-only";
import { OpenAIProvider } from "./openai";
import { MockAIProvider } from "./mock";
import type { AIProvider } from "./types";
import { AIProviderConfigError } from "./errors";
import { DEFAULT_MODEL } from "./constants";
import { readAIConfig } from "@/lib/ai-config";

/** DeepSeek 官方 API 地址。 */
export const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/**
 * 返回 AI Provider。
 * - 仅当显式设置 MOCK_AI=1 时使用 Mock（测试/演示用，非正式）。
 * - 优先使用页面里配置的运行时 Key（ai-config.json，可在页面「API 设置」中修改）；
 *   未配置时回退到环境变量 DEEPSEEK_API_KEY / DEEPSEEK_BASE_URL / DEEPSEEK_MODEL。
 * - 两者都没有时抛出清晰的配置错误。
 */
export function getAIProvider(): AIProvider {
  if (process.env.MOCK_AI === "1") {
    return new MockAIProvider();
  }

  const runtimeConfig = readAIConfig();
  if (runtimeConfig) {
    return new OpenAIProvider({
      apiKey: runtimeConfig.apiKey,
      baseURL: runtimeConfig.baseURL || process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL,
      model: runtimeConfig.model || process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL,
    });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new AIProviderConfigError(
      "未配置 AI API Key。可在练习页底部「API 设置」中填写，或在项目根目录 .env 文件设置 DEEPSEEK_API_KEY。",
    );
  }
  return new OpenAIProvider({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || DEEPSEEK_BASE_URL,
    model: process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL,
  });
}