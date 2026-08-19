"use client";

import { useState } from "react";
import type { listItemsForReview } from "@/services/learning-item-service";

type ReviewItem = Awaited<ReturnType<typeof listItemsForReview>>[number];

export function ReviewDeck({ items }: { items: ReviewItem[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (items.length === 0) {
    return <p className="text-sm text-text-muted">学习库还没有内容，先去收藏一些表达吧。</p>;
  }

  const item = items[index];
  const goTo = (next: number) => {
    setFlipped(false);
    setIndex(((next % items.length) + items.length) % items.length);
  };
  const progress = ((index + 1) / items.length) * 100;

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {/* 进度 */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs text-text-muted">
          <span>复习进度</span>
          <span>
            {index + 1} / {items.length}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-border/70">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 卡片 */}
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="block w-full rounded-lg border border-border bg-paper p-8 text-left shadow-card transition-shadow duration-150 hover:shadow-card-hover"
      >
        <div key={flipped ? "back" : "front"} className="animate-fade-in min-h-52">
          {!flipped ? (
            <div className="flex h-52 items-center justify-center">
              <p className="text-center font-serif text-2xl font-medium leading-snug text-text">
                {item.text}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-serif text-xl font-medium text-text">{item.text}</p>
              <dl className="space-y-2 text-sm leading-6 text-text">
                <div>
                  <dt className="inline text-text-muted">中文释义：</dt>
                  <dd className="inline">{item.meaningZh || "（未填写）"}</dd>
                </div>
                <div>
                  <dt className="inline text-text-muted">英文解释：</dt>
                  <dd className="inline">{item.explanationEn || "（未填写）"}</dd>
                </div>
                {item.writingUsage ? (
                  <div>
                    <dt className="inline text-text-muted">写作示例：</dt>
                    <dd className="inline">{item.writingUsage}</dd>
                  </div>
                ) : null}
                {item.sourceSentence ? (
                  <div>
                    <dt className="inline text-text-muted">来源例句：</dt>
                    <dd className="inline font-serif italic">{item.sourceSentence}</dd>
                  </div>
                ) : null}
                {item.notes ? (
                  <div>
                    <dt className="inline text-text-muted">笔记：</dt>
                    <dd className="inline">{item.notes}</dd>
                  </div>
                ) : null}
              </dl>
              {item.material ? (
                <p className="text-xs text-text-muted">来自：{item.material.title}</p>
              ) : null}
            </div>
          )}
        </div>
      </button>

      <p className="text-center text-xs text-text-muted">点击卡片翻面</p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          className="btn btn-outline px-4 py-2"
        >
          上一张
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          className="btn btn-primary px-4 py-2"
        >
          下一张
        </button>
      </div>
    </div>
  );
}