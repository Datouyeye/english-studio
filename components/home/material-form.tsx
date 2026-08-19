"use client";

import { useActionState, useState } from "react";
import {
  generateMaterialAction,
  type GenerateMaterialState,
} from "@/app/actions/material";
import { LEVEL_LABELS, LIMITS, TARGET_LEVELS } from "@/lib/constants";
import { FileDropzone } from "./file-dropzone";

export function MaterialForm() {
  const [state, formAction, pending] = useActionState<GenerateMaterialState | undefined, FormData>(
    generateMaterialAction,
    undefined,
  );
  const [originalText, setOriginalText] = useState("");
  const [fileNotice, setFileNotice] = useState<string | null>(null);

  return (
    <form action={formAction} className="mt-6 space-y-5 rounded-lg border border-border bg-paper p-6 sm:p-8">
      <div>
        <label htmlFor="title" className="mb-2 block text-sm text-text-muted">
          标题（可选）
        </label>
        <input
          id="title"
          name="title"
          maxLength={LIMITS.titleMax}
          placeholder="例如：一篇关于晨间习惯的文章"
          className="input"
        />
      </div>

      <div>
        <label htmlFor="originalText" className="mb-2 block text-sm text-text-muted">
          材料内容
        </label>
        <textarea
          id="originalText"
          name="originalText"
          required
          maxLength={LIMITS.originalTextMax}
          rows={10}
          value={originalText}
          onChange={(event) => {
            setOriginalText(event.target.value);
            setFileNotice(null);
          }}
          placeholder="粘贴中文或英文材料，或把文件拖到下方……"
          className="input resize-y leading-7"
        />
        <p className="mt-2 text-xs text-text-muted">
          已输入 {originalText.length.toLocaleString()} / {LIMITS.originalTextMax.toLocaleString()} 字符
        </p>
        {fileNotice ? <p className="mt-2 text-xs text-primary">{fileNotice}</p> : null}
      </div>

      <FileDropzone
        onTextExtracted={(text, truncated) => {
          setOriginalText(text);
          setFileNotice(
            truncated
              ? "文件较长，已自动截取前 20000 字。"
              : "已从文件填入文字，你可以先看看再生成。",
          );
        }}
      />

      <fieldset>
        <legend className="mb-2 block text-sm text-text-muted">目标英语水平</legend>
        <div className="segmented" role="radiogroup" aria-label="目标英语水平">
          {TARGET_LEVELS.map((level) => (
            <label key={level} className="cursor-pointer">
              <input
                type="radio"
                name="targetLevel"
                value={level}
                defaultChecked={level === "CET6"}
                className="peer sr-only"
              />
              <span className="segmented-item peer-checked:bg-paper peer-checked:text-primary peer-checked:shadow-card">
                {LEVEL_LABELS[level]}
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          等级只影响英文难度与风格，不影响内容多少
        </p>
      </fieldset>

      {state?.error ? (
        <p className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary w-full py-2.5">
        {pending ? "生成中…" : "生成英文文章"}
      </button>
    </form>
  );
}