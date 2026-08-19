"use client";

import { useState } from "react";
import { AdaptedArticle } from "./adapted-article";
import type { getMaterialWithItems } from "@/services/material-service";

type LearningItem = Awaited<ReturnType<typeof getMaterialWithItems>>["learningItems"][number];

export function ArticleView({
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
  const [view, setView] = useState<"adapted" | "original">("adapted");

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
        <AdaptedArticle materialId={materialId} adaptedText={adaptedText} items={items} />
      ) : (
        <div className="mt-6 whitespace-pre-wrap rounded-lg border border-border bg-paper p-6 text-[15px] leading-8 text-text sm:p-8">
          {originalText}
        </div>
      )}
    </div>
  );
}