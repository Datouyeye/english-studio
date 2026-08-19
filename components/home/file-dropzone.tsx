"use client";

import { useRef, useState, useTransition } from "react";
import { extractTextFromFileAction } from "@/app/actions/file";

export function FileDropzone({
  onTextExtracted,
}: {
  onTextExtracted: (text: string, truncated: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    setStatus({ ok: true, message: `正在读取 ${file.name}…` });
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await extractTextFromFileAction(formData);
      if (result.error) {
        setStatus({ ok: false, message: result.error });
        return;
      }
      if (result.text !== undefined) {
        onTextExtracted(result.text, result.truncated ?? false);
        setStatus({
          ok: true,
          message: `已从「${file.name}」读出文字${result.truncated ? "（内容较长，已截取前 20000 字）" : ""}，已填入上方输入框，请确认后生成。`,
        });
      }
    });
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={
          dragging
            ? "cursor-pointer rounded-md border-2 border-dashed border-primary bg-primary-soft px-4 py-5 text-center text-sm text-primary"
            : "cursor-pointer rounded-md border border-dashed border-border bg-paper px-4 py-5 text-center text-sm text-text-muted transition-colors duration-150 hover:border-primary/40 hover:text-text"
        }
      >
        {isPending ? "正在读取文件…" : "把 TXT / PDF / Word（.docx）文件拖到这里，或点击选择文件"}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf,.docx"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>
      {status ? (
        <p className={status.ok ? "mt-2 text-xs text-primary" : "mt-2 text-xs text-danger"}>
          {status.message}
        </p>
      ) : (
        <p className="mt-2 text-xs text-text-muted">
          只支持文字版 PDF（扫描件/图片版暂时不行）；文件里的文字会自动填到上面的输入框。
        </p>
      )}
    </div>
  );
}