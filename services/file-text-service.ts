import iconv from "iconv-lite";
import { LIMITS } from "@/lib/constants";
import { AppError } from "@/lib/errors";

export interface ExtractedText {
  text: string;
  truncated: boolean;
  format: "txt" | "pdf" | "docx";
}

const ALLOWED_EXTENSIONS = ["txt", "pdf", "docx"] as const;

/** 从上传文件中提取纯文本（TXT / 文字版 PDF / .docx）。扫描版 PDF 与图片暂不支持（无 OCR）。 */
export async function extractTextFromFile(input: {
  name: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<ExtractedText> {
  const ext = input.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new AppError(
      "不支持的格式，目前支持 TXT、PDF、Word（.docx）文件。",
      "UNSUPPORTED_FILE_TYPE",
    );
  }

  let text = "";
  try {
    if (ext === "txt") {
      text = decodeTextFile(input.buffer);
    } else if (ext === "pdf") {
      text = await extractPdfText(input.buffer);
    } else {
      text = await extractDocxText(input.buffer);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      ext === "pdf"
        ? "PDF 解析失败，请确认文件没有损坏，且不是扫描件/图片版（扫描版暂不支持）。"
        : "文件解析失败，请确认文件没有损坏。",
      "PARSE_ERROR",
    );
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new AppError(
      ext === "pdf"
        ? "这个 PDF 看起来是扫描件或图片版，暂时无法提取文字。"
        : "没能从文件里读出文字，请确认文件内容。",
      "EMPTY_TEXT",
    );
  }

  const truncated = trimmed.length > LIMITS.originalTextMax;
  return {
    text: truncated ? trimmed.slice(0, LIMITS.originalTextMax) : trimmed,
    truncated,
    format: ext as "txt" | "pdf" | "docx",
  };
}

/** TXT 解码：优先 UTF-8（去 BOM），出现乱码替换符时回退 GBK（中文 Windows 常见）。 */
function decodeTextFile(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString("utf8");
  }
  const utf8 = buffer.toString("utf8");
  const replacementCount = (utf8.match(/\uFFFD/g) ?? []).length;
  if (replacementCount > 0) {
    return iconv.decode(buffer, "gbk");
  }
  return utf8;
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const doc = await loadingTask.promise;
  try {
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      text +=
        content.items
          .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
          .join(" ") + "\n";
    }
    return text;
  } finally {
    await loadingTask.destroy().catch(() => undefined);
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}