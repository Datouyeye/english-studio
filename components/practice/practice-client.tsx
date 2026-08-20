"use client";

import { useState } from "react";
import {
  addUserSentencesAction,
  judgePracticeTranslationAction,
  savePracticeExpressionAction,
} from "@/app/actions/practice";

type SentenceBrief = { id: string; zhText: string; scene: "work" | "life" };
type Judgement = {
  score: number;
  passed: boolean;
  feedback: string;
  suggestions: string[];
  referenceTranslation: string;
};

const SCENE_LABEL: Record<"work" | "life", string> = { work: "工作", life: "生活" };

export function PracticeClient({ sentences }: { sentences: SentenceBrief[] }) {
  const [index, setIndex] = useState(0);
  const [userText, setUserText] = useState("");
  const [judgement, setJudgement] = useState<Judgement | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 自定义题目窗口
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customResult, setCustomResult] = useState<string | null>(null);

  const current = sentences[index];

  if (!current) {
    return <p className="text-sm text-text-muted">题库还没有内容，稍后再来试试。</p>;
  }

  const resetForNext = () => {
    setUserText("");
    setJudgement(null);
    setShowReference(false);
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!userText.trim() || busy) return;
    setBusy(true);
    setError(null);
    setJudgement(null);
    setShowReference(false);
    const res = await judgePracticeTranslationAction(current.id, userText);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setJudgement(res.result!);
  };

  const handleNext = () => {
    resetForNext();
    setIndex((i) => (i + 1) % sentences.length);
  };

  const handleSave = async () => {
    if (!judgement || busy) return;
    setBusy(true);
    setError(null);
    const res = await savePracticeExpressionAction(current.zhText, judgement.referenceTranslation);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSaved(true);
  };

  const handleCustomSubmit = async () => {
    if (!customText.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await addUserSentencesAction(customText);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setCustomResult(
      `已加入题库 ${res.inserted} 条${res.skipped ? `，跳过重复 ${res.skipped} 条` : ""}，下次练习会出现。`,
    );
    setCustomText("");
  };

  return (
    <div className="space-y-6">
      {/* ===== 题目卡 ===== */}
      <section className="rounded-lg border border-border bg-paper p-6 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">
            第 {index + 1} / {sentences.length} 题
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
            {SCENE_LABEL[current.scene]}
          </span>
        </div>
        <p className="mt-4 font-serif text-xl leading-relaxed text-text">{current.zhText}</p>

        {/* 翻译输入 */}
        <textarea
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          rows={4}
          disabled={!!judgement}
          placeholder="把你的英文翻译写在这里……"
          className="input mt-5 resize-y leading-7"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy || !userText.trim() || !!judgement}
            className="btn btn-primary"
          >
            {busy ? "判定中……" : "提交判定"}
          </button>
          {judgement ? (
            <button type="button" onClick={handleNext} className="btn">
              下一题
            </button>
          ) : null}
        </div>
      </section>

      {/* ===== 判定结果 ===== */}
      {judgement ? (
        <section className="space-y-5 rounded-lg border border-border bg-paper p-6 shadow-card">
          {/* 状态行 + 评分条 */}
          <div>
            <div className="flex items-baseline justify-between">
              <p
                className={`text-sm font-medium ${
                  judgement.passed ? "text-primary" : "text-danger"
                }`}
              >
                {judgement.passed ? "完成度高，已通过" : "还没达到完成度，可以再改一版"}
              </p>
              <span className="text-xs text-text-muted">评分 {judgement.score} / 5</span>
            </div>
            <div className="mt-2 flex gap-1.5" aria-label={`评分 ${judgement.score} 分（满分 5 分）`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`h-1.5 flex-1 rounded-full ${
                    n <= judgement.score ? "bg-primary" : "bg-border/70"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 总评（中文） */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-medium text-text-muted">总评</h3>
            <p className="rounded-md bg-background-tertiary p-3.5 text-sm leading-relaxed text-text">
              {judgement.feedback}
            </p>
          </div>

          {/* 改进建议（英文） */}
          {judgement.suggestions.length > 0 ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-medium text-text-muted">更地道的改法</h3>
              <ol className="space-y-1.5">
                {judgement.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 rounded-md border border-border p-3 text-sm leading-relaxed"
                  >
                    <span className="mt-0.5 shrink-0 text-xs font-medium text-primary">
                      {i + 1}.
                    </span>
                    <span className="text-text">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {/* 参考答案（可盖住） */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">参考答案</span>
            </div>
            <button
              type="button"
              onClick={() => setShowReference((v) => !v)}
              aria-pressed={showReference}
              className="relative block w-full rounded-md transition-transform duration-500"
              style={{
                perspective: "800px",
                transformStyle: "preserve-3d",
                transform: showReference ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <span
                className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-border bg-paper px-4 text-sm text-text-muted transition-colors duration-150 hover:border-primary/40 hover:text-text"
                style={{ backfaceVisibility: "hidden" }}
              >
                点击查看答案
              </span>
              <span
                className="absolute inset-0 flex items-center justify-center rounded-md border border-border bg-background-tertiary px-4 py-3 text-sm leading-relaxed text-text"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                {judgement.referenceTranslation}
              </span>
            </button>
          </div>

          {/* 操作区：未通过可重试/下一题；通过可收藏/下一题 */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
            {!judgement.passed ? (
              <button
                type="button"
                onClick={() => {
                  setJudgement(null);
                  setShowReference(false);
                }}
                className="btn btn-primary"
              >
                按建议再改一版
              </button>
            ) : (
              <button type="button" onClick={handleSave} disabled={busy || saved} className="btn">
                {saved ? "已加入学习库 ✓" : "收藏该表达"}
              </button>
            )}
            <button type="button" onClick={handleNext} className="btn">
              下一题
            </button>
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {/* ===== 自定义题目入口 ===== */}
      <section className="rounded-lg border border-dashed border-border p-5">
        {!customOpen ? (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            className="text-sm text-primary hover:underline"
          >
            ＋ 输入自己的句子（AI 帮你拆分成练习题）
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">
              写下一段你想练习的中文（可以是工作里说的话、想表达的观点），AI 会识别场景、拆分长句、润色后加入题库。
            </p>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={4}
              placeholder="例如：我最近在学怎么在会议上清晰地表达自己的观点……"
              className="input resize-y leading-7"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={busy || !customText.trim()}
                className="btn btn-primary"
              >
                {busy ? "加工中……" : "确认加入题库"}
              </button>
              <button type="button" onClick={() => setCustomOpen(false)} className="btn">
                收起
              </button>
            </div>
            {customResult ? <p className="text-sm text-primary">{customResult}</p> : null}
          </div>
        )}
      </section>
    </div>
  );
}
