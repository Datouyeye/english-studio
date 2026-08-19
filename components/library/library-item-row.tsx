"use client";

import { useState, useTransition } from "react";
import {
  deleteLearningItemAction,
  updateLearningItemAction,
} from "@/app/actions/learning-item";
import type { listLearningItems } from "@/services/learning-item-service";

type Item = Awaited<ReturnType<typeof listLearningItems>>[number];

const itemTypeLabel: Record<Item["itemType"], string> = {
  word: "单词",
  phrase: "短语",
  sentence: "句子",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function LibraryItemRow({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false);
  const [meaningZh, setMeaningZh] = useState(item.meaningZh);
  const [explanationEn, setExplanationEn] = useState(item.explanationEn);
  const [writingUsage, setWritingUsage] = useState(item.writingUsage);
  const [notes, setNotes] = useState(item.notes);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateLearningItemAction({
        id: item.id,
        meaningZh,
        explanationEn,
        writingUsage,
        notes,
      });
      if (result.error) {
        setMessage({ ok: false, text: result.error });
      } else {
        setMessage({ ok: true, text: "已保存" });
        setEditing(false);
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm("确定删除这条学习内容吗？")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteLearningItemAction({ id: item.id });
      if (result.error) setMessage({ ok: false, text: result.error });
    });
  };

  return (
    <li className="group border-b border-border py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-text">{item.text}</p>
          <p className="mt-1 text-sm text-text-muted">
            {item.meaningZh || "（未填写释义）"}
          </p>
        </div>
        <div className="flex shrink-0 gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-background hover:text-text"
          >
            {editing ? "收起" : "编辑"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="rounded px-1.5 py-0.5 text-xs text-text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
          >
            删除
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-text-muted">
        {itemTypeLabel[item.itemType]}
        {item.sourceType === "ai" ? " · AI 推荐" : " · 手动收藏"}
        {item.material ? ` · ${item.material.title}` : ""}
        {` · ${formatDate(item.createdAt)}`}
      </p>

      {!editing && item.writingUsage ? (
        <p className="mt-2 text-xs leading-5 text-text-muted">
          <span className="text-text-muted">写作示例：</span>
          {item.writingUsage}
        </p>
      ) : null}

      {editing ? (
        <div className="mt-3 space-y-3 rounded-md border border-border bg-background/40 p-4">
          <label className="block text-xs font-medium text-text-muted">
            中文释义
            <textarea
              value={meaningZh}
              onChange={(event) => setMeaningZh(event.target.value)}
              rows={1}
              className="input mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-text-muted">
            英文解释
            <textarea
              value={explanationEn}
              onChange={(event) => setExplanationEn(event.target.value)}
              rows={2}
              className="input mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-text-muted">
            写作示例（怎么用在作文里）
            <textarea
              value={writingUsage}
              onChange={(event) => setWritingUsage(event.target.value)}
              rows={2}
              className="input mt-1"
            />
          </label>
          <label className="block text-xs font-medium text-text-muted">
            笔记
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className="input mt-1"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="btn btn-primary px-3 py-1.5"
            >
              保存
            </button>
            {message ? (
              <span className={message.ok ? "text-sm text-primary" : "text-sm text-danger"}>
                {message.text}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}