import { afterEach, describe, expect, it, vi } from "vitest";
import { getAIProvider } from "@/lib/ai";
import { AIProviderConfigError } from "@/lib/ai/errors";
import { MockAIProvider } from "@/lib/ai/mock";

// 隔离"页面里配置的 AI Key"（ai-config.json），让本文件只测环境变量逻辑
vi.mock("@/lib/ai-config", () => ({
  readAIConfig: () => null,
  writeAIConfig: vi.fn(),
  clearAIConfig: vi.fn(),
}));

const originalMock = process.env.MOCK_AI;
const originalKey = process.env.DEEPSEEK_API_KEY;

afterEach(() => {
  if (originalMock === undefined) delete process.env.MOCK_AI;
  else process.env.MOCK_AI = originalMock;
  if (originalKey === undefined) delete process.env.DEEPSEEK_API_KEY;
  else process.env.DEEPSEEK_API_KEY = originalKey;
});

describe("getAIProvider", () => {
  it("MOCK_AI=1 时返回 MockAIProvider", () => {
    process.env.MOCK_AI = "1";
    expect(getAIProvider()).toBeInstanceOf(MockAIProvider);
  });

  it("缺少 DEEPSEEK_API_KEY 时抛出清晰的配置错误", () => {
    delete process.env.MOCK_AI;
    delete process.env.DEEPSEEK_API_KEY;
    expect(() => getAIProvider()).toThrow(AIProviderConfigError);
  });

  it("配置了 DEEPSEEK_API_KEY 时返回 OpenAI 兼容 Provider", () => {
    delete process.env.MOCK_AI;
    process.env.DEEPSEEK_API_KEY = "test-key";
    const provider = getAIProvider();
    expect(provider.name).toBe("openai-compatible");
  });
});