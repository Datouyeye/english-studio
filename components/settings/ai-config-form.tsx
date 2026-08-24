"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearAIConfigAction, saveAIConfigAction } from "@/app/actions/ai-config";

export function AIConfigForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [aiKey, setAiKey] = useState("");
  const [aiBaseURL, setAiBaseURL] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    const res = await saveAIConfigAction({
      apiKey: aiKey,
      baseURL: aiBaseURL || undefined,
      model: aiModel || undefined,
    });
    setSaving(false);
    if (res.error) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
    setMsg({ kind: "ok", text: "已保存，之后的 AI 请求立即使用新配置（无需重启）。" });
    setAiKey("");
    setAiBaseURL("");
    setAiModel("");
    router.refresh();
  };

  const handleClear = async () => {
    if (saving) return;
    setSaving(true);
    setMsg(null);
    const res = await clearAIConfigAction();
    setSaving(false);
    if (res.error) {
      setMsg({ kind: "err", text: res.error });
      return;
    }
    setMsg({ kind: "ok", text: "已清除页面配置，回退到 .env 中的 Key。" });
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <section className="space-y-4 rounded-lg border border-border bg-paper p-6 shadow-card">
        <div className="space-y-2.5">
          <div>
            <label htmlFor="ai-key" className="mb-1 block text-sm text-text-muted">
              API Key <span className="text-danger">*</span>
            </label>
            <input
              id="ai-key"
              type="password"
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              placeholder="sk-……（支持任意 OpenAI 兼容服务）"
              className="input"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="ai-base-url" className="mb-1 block text-sm text-text-muted">
              Base URL（可选，默认 https://api.deepseek.com）
            </label>
            <input
              id="ai-base-url"
              type="text"
              value={aiBaseURL}
              onChange={(e) => setAiBaseURL(e.target.value)}
              placeholder="https://api.deepseek.com"
              className="input"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="ai-model" className="mb-1 block text-sm text-text-muted">
              Model（可选，默认使用服务商默认模型）
            </label>
            <input
              id="ai-model"
              type="text"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder="deepseek-chat"
              className="input"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saving || !aiKey.trim()} className="btn btn-primary">
            {saving ? "保存中……" : "保存并生效"}
          </button>
          {configured ? (
            <button type="button" onClick={handleClear} disabled={saving} className="btn">
              清除页面配置
            </button>
          ) : null}
        </div>

        {msg ? (
          <p className={`text-sm ${msg.kind === "ok" ? "text-primary" : "text-danger"}`}>{msg.text}</p>
        ) : null}
      </section>
    </div>
  );
}
