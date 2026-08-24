"use server";

import { clearAIConfig, writeAIConfig } from "@/lib/ai-config";

export interface SaveAIConfigState {
  success?: boolean;
  error?: string;
}

/**
 * 保存页面里填写的 AI 配置（API Key / 可选 Base URL / 可选 Model）。
 * 写入项目根目录 ai-config.json（gitignored），getAIProvider 会优先读取，
 * 无需重启服务器即可生效。
 */
export async function saveAIConfigAction(input: {
  apiKey: string;
  baseURL?: string;
  model?: string;
}): Promise<SaveAIConfigState> {
  const apiKey = input.apiKey.trim();
  if (!apiKey) {
    return { error: "API Key 不能为空" };
  }
  try {
    writeAIConfig({
      apiKey,
      baseURL: input.baseURL?.trim() || undefined,
      model: input.model?.trim() || undefined,
    });
    return { success: true };
  } catch {
    return { error: "保存失败，请检查目录写入权限。" };
  }
}

/** 清除页面里配置的 AI Key，回退到 .env 环境变量。 */
export async function clearAIConfigAction(): Promise<SaveAIConfigState> {
  try {
    clearAIConfig();
    return { success: true };
  } catch {
    return { error: "清除失败，请检查目录权限。" };
  }
}
