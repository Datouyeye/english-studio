import fs from "node:fs";
import path from "node:path";

/**
 * 运行时 AI 配置（用户在页面里填写的 API Key 等）。
 * 保存在项目根目录 ai-config.json（已在 .gitignore 排除，不会入库）。
 * 优先级高于 .env 环境变量：getAIProvider 会先读这里。
 */
export interface AIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

const CONFIG_PATH = path.join(process.cwd(), "ai-config.json");

/** 读取运行时 AI 配置；不存在或损坏时返回 null。 */
export function readAIConfig(): AIConfig | null {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Partial<AIConfig>;
    if (!parsed.apiKey || typeof parsed.apiKey !== "string" || !parsed.apiKey.trim()) {
      return null;
    }
    return {
      apiKey: parsed.apiKey.trim(),
      baseURL: parsed.baseURL?.trim() || undefined,
      model: parsed.model?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

/** 写入运行时 AI 配置（覆盖旧值）。 */
export function writeAIConfig(config: AIConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

/** 清除运行时 AI 配置（回退到 .env 环境变量）。 */
export function clearAIConfig(): void {
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH);
  }
}
