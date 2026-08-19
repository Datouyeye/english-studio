"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import {
  addLearningItemAction,
  deleteLearningItemAction,
} from "@/app/actions/learning-item";
import { normalizeText, splitSentences } from "@/lib/text";
import type { ItemType } from "@/lib/constants";
import type { getMaterialWithItems } from "@/services/material-service";

type LearningItem = Awaited<ReturnType<typeof getMaterialWithItems>>["learningItems"][number];

const itemTypeLabel: Record<LearningItem["itemType"], string> = {
  word: "单词",
  phrase: "短语",
  sentence: "句子",
};

interface ActiveSelection {
  text: string;
  itemType: ItemType;
  sentence?: string;
  x: number;
  y: number;
}

function inferItemType(text: string): ItemType {
  if (/[.!?]$/.test(text) || text.split(/\s+/).length >= 6) return "sentence";
  if (/\s/.test(text)) return "phrase";
  return "word";
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 把段落中出现的表达词用荧光笔 <mark> 包起来（不改变任何文字内容）。 */
function highlightText(text: string, terms: string[]): ReactNode[] {
  if (terms.length === 0) return [text];
  const pattern = terms
    .map(escapeRegExp)
    .sort((a, b) => b.length - a.length)
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));
  const lowerTerms = terms.map((term) => term.toLowerCase());
  return parts.map((part, index) => {
    if (part && lowerTerms.includes(part.toLowerCase())) {
      return (
        <mark key={index} className="rounded-[2px] bg-mark px-0.5 text-inherit">
          {part}
        </mark>
      );
    }
    return part;
  });
}

export function ReadingView({
  materialId,
  adaptedText,
  originalText,
  items,
}: {
  materialId: string;
  adaptedText: string;
  originalText: string;
  items: LearningItem[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"adapted" | "original">("adapted");
  const [selection, setSelection] = useState<ActiveSelection | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // 按段落切分正文，并把每个表达挂到它第一次出现的段落
  const paragraphs = adaptedText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const terms = items.map((item) => item.text);
  const placed = new Set<string>();
  const cardsByParagraph = new Map<number, LearningItem[]>();
  paragraphs.forEach((paragraph, index) => {
    const normalizedParagraph = normalizeText(paragraph);
    const matched = items.filter(
      (item) => !placed.has(item.normalizedText) && normalizedParagraph.includes(item.normalizedText),
    );
    if (matched.length > 0) {
      matched.forEach((item) => placed.add(item.normalizedText));
      cardsByParagraph.set(index, matched);
    }
  });

  const inParagraph = (node: Node | null): boolean => {
    if (!node) return false;
    const element = node instanceof Element ? node : node.parentElement;
    return element?.closest("[data-para]") !== null;
  };

  const handleSelectionChange = () => {
    const nativeSelection = window.getSelection();
    const container = containerRef.current;
    if (
      !nativeSelection ||
      nativeSelection.isCollapsed ||
      !container ||
      !container.contains(nativeSelection.anchorNode) ||
      !container.contains(nativeSelection.focusNode) ||
      !inParagraph(nativeSelection.anchorNode) ||
      !inParagraph(nativeSelection.focusNode)
    ) {
      setSelection(null);
      return;
    }
    const text = nativeSelection.toString().trim();
    if (!text || text.length > 200) {
      setSelection(null);
      return;
    }
    const range = nativeSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const sentence = splitSentences(adaptedText).find((s) =>
      s.toLocaleLowerCase().includes(text.toLocaleLowerCase()),
    );
    setSelection({
      text,
      itemType: inferItemType(text),
      sentence,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const clearSelection = () => {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setFeedback(null);
  };

  const runAdd = (text: string, itemType: ItemType) => {
    startTransition(async () => {
      const result = await addLearningItemAction({ materialId, text, itemType });
      if (result.error) {
        setFeedback({ ok: false, message: result.error });
      } else {
        setFeedback({ ok: true, message: "已加入学习库" });
      }
      clearSelection();
    });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("确定删除这条学习内容吗？")) return;
    startTransition(async () => {
      const result = await deleteLearningItemAction({ id });
      if (result.error) setFeedback({ ok: false, message: result.error });
    });
  };

  return (
    <div>
      <div className="segmented" role="tablist" aria-label="查看方式">
        <button
          type="button"
          role="tab"
          aria-selected={view === "adapted"}
          onClick={() => setView("adapted")}
          className={view === "adapted" ? "segmented-item segmented-item-active" : "segmented-item"}
        >
          改写文章
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "original"}
          onClick={() => setView("original")}
          className={view === "original" ? "segmented-item segmented-item-active" : "segmented-item"}
        >
          原始材料
        </button>
      </div>

      {view === "adapted" ? (
        <div className="relative mt-6 max-w-[880px]">
          <div
            ref={containerRef}
            onMouseUp={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onTouchEnd={handleSelectionChange}
            className="space-y-6 rounded-lg border border-border bg-paper p-6 shadow-card sm:p-8"
          >
            {paragraphs.map((paragraph, index) => {
              const cards = cardsByParagraph.get(index) ?? [];
              return (
                <div
                  key={index}
                  className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-start lg:gap-6"
                >
                  <p
                    data-para
                    className="min-w-0 font-serif text-[18px] leading-[1.8] text-text"
                  >
                    {highlightText(paragraph, terms)}
                  </p>
                  {cards.length > 0 ? (
                    <aside className="space-y-2">
                      {cards.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-md border border-border/80 bg-background/60 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-text">{item.text}</p>
                              <p className="mt-0.5 text-xs text-text-muted">
                                {item.meaningZh || "（未填写释义）"}
                              </p>
                            </div>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDelete(item.id)}
                              className="shrink-0 rounded px-1.5 py-0.5 text-xs text-text-muted/70 transition-colors duration-150 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                            >
                              删除
                            </button>
                          </div>
                          <p className="mt-1 text-[11px] text-text-muted">
                            {itemTypeLabel[item.itemType]}
                            {item.sourceType === "ai" ? " · AI 推荐" : " · 手动收藏"}
                          </p>
                          {item.writingUsage ? (
                            <p className="mt-1.5 text-[11px] leading-4 text-text-muted">
                              {item.writingUsage}
                            </p>
                          ) : null}
                          {item.sourceSentence ? (
                            <p className="mt-1.5 font-serif text-xs italic leading-5 text-text-muted">
                              {item.sourceSentence}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </aside>
                  ) : null}
                </div>
              );
            })}
          </div>

          {selection && (
            <div
              className="pointer-events-none fixed z-10 flex -translate-x-1/2 gap-1 rounded-md border border-border bg-paper px-2 py-1.5 shadow-card-hover"
              style={{ left: selection.x, top: Math.max(selection.y - 48, 8) }}
            >
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAdd(selection.text, selection.itemType)}
                className="pointer-events-auto rounded px-2 py-1 text-xs text-primary hover:bg-primary-soft"
              >
                加入学习库（{selection.itemType}）
              </button>
              {selection.itemType !== "sentence" && selection.sentence && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAdd(selection.sentence as string, "sentence")}
                  className="pointer-events-auto rounded px-2 py-1 text-xs text-text-muted hover:bg-background"
                >
                  整句加入
                </button>
              )}
              <button
                type="button"
                onClick={clearSelection}
                className="pointer-events-auto rounded px-2 py-1 text-xs text-text-muted hover:bg-background"
              >
                取消
              </button>
            </div>
          )}

          {feedback && (
            <p
              className={feedback.ok ? "mt-3 text-sm text-primary" : "mt-3 text-sm text-danger"}
            >
              {feedback.message}
            </p>
          )}

          <p className="mt-3 text-xs text-text-muted">
            提示：在文章中选中单词、短语或句子，即可加入学习库。
          </p>
        </div>
      ) : (
        <div className="mt-6 whitespace-pre-wrap rounded-lg border border-border bg-paper p-6 text-[15px] leading-8 text-text sm:p-8">
          {originalText}
        </div>
      )}
    </div>
  );
}