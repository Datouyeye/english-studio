"use client";

import { useState, useTransition } from "react";
import { deleteLearningItemAction } from "@/app/actions/learning-item";
import type { getMaterialWithItems } from "@/services/material-service";

type Item = Awaited<ReturnType<typeof getMaterialWithItems>>["learningItems"][number];

const itemTypeLabel: Record<Item["itemType"], string> = {
  word: "单词",
  phrase: "短语",
  sentence: "句子",
};

export function LearningItemList({ items }: { items: Item[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!window.confirm("确定删除这条学习内容吗？")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteLearningItemAction({ id });
      if (result.error) setError(result.error);
    });
  };

  if (items.length === 0) {
    return <p className="rounded-lg border border-border bg-paper px-4 py-3 text-sm text-text-muted">这篇文章还没有学习内容。</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-border rounded-lg border border-border bg-paper px-4">
        {items.map((item) => (
          <li key={item.id} className="group py-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-text">{item.text}</p>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDelete(item.id)}
                className="shrink-0 rounded px-1.5 py-0.5 text-xs text-text-muted/60 transition-colors duration-150 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
              >
                删除
              </button>
            </div>
            <p className="mt-0.5 text-xs text-text-muted">
              {itemTypeLabel[item.itemType]}
              {item.sourceType === "ai" ? " · AI 推荐" : " · 手动收藏"}
            </p>
            {item.meaningZh ? (
              <p className="mt-2 text-sm text-text">{item.meaningZh}</p>
            ) : null}
            {item.writingUsage ? (
              <p className="mt-1.5 text-xs leading-5 text-text-muted">{item.writingUsage}</p>
            ) : null}
            {item.sourceSentence ? (
              <p className="mt-1.5 font-serif text-[13px] italic leading-5 text-text-muted">
                {item.sourceSentence}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}