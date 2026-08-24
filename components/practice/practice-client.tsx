"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMoreSentencesAction,
  addUserSentencesAction,
  judgePracticeTranslationAction,
  lookupWordAction,
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

export function PracticeClient({
  sentences,
  todayCount: initialTodayCount,
}: {
  sentences: SentenceBrief[];
  todayCount: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [userText, setUserText] = useState("");
  const [judgement, setJudgement] = useState<Judgement | null>(null);
  const [showReference, setShowReference] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // 今日新增状态提示
  const [todayCount, setTodayCount] = useState(initialTodayCount);
  const [addingMore, setAddingMore] = useState(false);
  const [moreMsg, setMoreMsg] = useState<string | null>(null);

  // 自定义题目窗口
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customResult, setCustomResult] = useState<string | null>(null);

  // 查词
  const [lookupText, setLookupText] = useState("");
  const [lookupResult, setLookupResult] = useState<{
    word: string;
    meaningZh: string;
    usage: string;
    example: string;
  } | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);

  const current = sentences.length > 0 ? sentences[index % sentences.length] : undefined;

  const handleAddMore = async () => {
    if (addingMore) return;
    setAddingMore(true);
    setError(null);
    setMoreMsg(null);
    const res = await addMoreSentencesAction();
    setAddingMore(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.todayCount !== undefined) setTodayCount(res.todayCount);
    setMoreMsg(`已新增 ${res.added ?? 0} 条，今日共 ${res.todayCount ?? todayCount} 条`);
    router.refresh(); // 重新拉取题目列表，新题立即可用
  };

  if (!current) {
    return (
      <div className="space-y-4">
        <DailyStatusBar
          todayCount={todayCount}
          addingMore={addingMore}
          onAddMore={handleAddMore}
        />
        <p className="text-sm text-text-muted">题库还没有内容，稍后再来试试。</p>
      </div>
    );
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
    if (res.success && res.result) {
      setJudgement(res.result);
      return;
    }
    setError(res.error ?? "判定失败，请稍后重试。");
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

  const handleLookup = async () => {
    if (!lookupText.trim() || lookupBusy) return;
    setLookupBusy(true);
    setError(null);
    const res = await lookupWordAction(lookupText);
    setLookupBusy(false);
    if (res.success && res.result) {
      setLookupResult(res.result);
      return;
    }
    setError(res.error ?? "查词失败，请稍后重试。");
    setLookupResult(null);
  };

  return (
    <div className="space-y-6">
      {/* ===== 今日新增状态条 ===== */}
      <DailyStatusBar
        todayCount={todayCount}
        addingMore={addingMore}
        onAddMore={handleAddMore}
      />
      {moreMsg ? <p className="text-sm text-primary">{moreMsg}</p> : null}

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

        {/* 查词：提笔忘词时输入中文意思或英文确认 */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={lookupText}
            onChange={(e) => setLookupText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleLookup();
            }}
            placeholder="提笔忘词？输入中文意思或英文确认一下"
            className="input"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupBusy || !lookupText.trim()}
            className="btn shrink-0"
          >
            {lookupBusy ? "查询中……" : "查词"}
          </button>
        </div>
        {lookupResult ? (
          <div className="mt-3 space-y-2 rounded-md border border-border bg-highlight/40 p-4 text-sm">
            <p className="font-medium text-text">{lookupResult.word}</p>
            <p className="leading-relaxed text-text">{lookupResult.meaningZh}</p>
            <p className="leading-relaxed text-text-muted">{lookupResult.usage}</p>
            <p className="italic leading-relaxed text-text">{lookupResult.example}</p>
          </div>
        ) : null}

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
            <p className="rounded-md bg-highlight/40 p-3.5 text-sm leading-relaxed text-text">
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

          {/* 参考答案（翻转卡片） */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">参考答案</span>
            </div>
            <button
              type="button"
              onClick={() => setShowReference((v) => !v)}
              aria-pressed={showReference}
              className="grid w-full transition-transform duration-500"
              style={{
                perspective: "800px",
                transformStyle: "preserve-3d",
                transform: showReference ? "rotateY(180deg)" : "rotateY(0deg)",
              }}
            >
              <span
                className="col-start-1 row-start-1 flex min-h-24 items-center justify-center rounded-md border border-dashed border-border bg-paper px-4 text-sm text-text-muted transition-colors duration-150 hover:border-primary/40 hover:text-text"
                style={{ backfaceVisibility: "hidden" }}
              >
                点击查看答案
              </span>
              <span
                className="col-start-1 row-start-1 flex items-center justify-center rounded-md border border-border bg-paper px-4 py-3 text-sm leading-relaxed text-text"
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

/** 今日新增状态条：显示今日入库条数，并提供手动追加题目入口。 */
function DailyStatusBar({
  todayCount,
  addingMore,
  onAddMore,
}: {
  todayCount: number;
  addingMore: boolean;
  onAddMore: () => void;
}) {
  return (
    <section className="flex items-center justify-between rounded-lg border border-border bg-paper px-4 py-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-text-muted">今日新增</span>
        <span className="text-sm font-medium text-primary">{todayCount} 条</span>
      </div>
      <button type="button" onClick={onAddMore} disabled={addingMore} className="btn text-sm">
        {addingMore ? "生成中……" : "增加题目"}
      </button>
    </section>
  );
}
