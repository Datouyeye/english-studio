import { readAIConfig } from "@/lib/ai-config";
import { AIConfigForm } from "@/components/settings/ai-config-form";

export const dynamic = "force-dynamic";

function maskKey(key: string): string {
  if (key.length <= 8) return "********";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export default async function SettingsPage() {
  const config = readAIConfig();

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">API 设置</h1>
        <p className="mt-2 text-sm text-text-muted">
          在这里配置 AI 接口的 Key，支持任意 OpenAI 兼容服务，保存后立即生效
        </p>
      </header>

      {config ? (
        <div className="mx-auto w-full max-w-2xl rounded-lg border border-border bg-paper p-4 text-sm">
          <p className="text-text">当前使用页面配置的 Key：</p>
          <ul className="mt-2 space-y-1 text-text-muted">
            <li>Key：{maskKey(config.apiKey)}</li>
            {config.baseURL ? <li>Base URL：{config.baseURL}</li> : null}
            {config.model ? <li>Model：{config.model}</li> : null}
          </ul>
        </div>
      ) : (
        <p className="mx-auto w-full max-w-2xl text-center text-sm text-text-muted">
          当前未配置页面 Key，使用 .env 中的 DEEPSEEK_API_KEY。
        </p>
      )}

      <AIConfigForm configured={!!config} />

      <p className="mx-auto w-full max-w-2xl text-xs leading-relaxed text-text-muted">
        说明：Key 只保存在本机项目目录的 ai-config.json（已加入 .gitignore，不会推送到
        GitHub，也不会上传任何云端）。填写后 AI 请求会优先使用这里的配置；点「清除页面配置」可回退到
        .env 环境变量。
      </p>
    </div>
  );
}
