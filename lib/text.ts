import { LIMITS } from "./constants";

/** 规范化文本：去首尾空白、小写、压缩空白，用于去重和包含判断。 */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** 判断 article 是否包含 itemText（大小写不敏感、空白不敏感）。 */
export function containsText(article: string, itemText: string): boolean {
  return normalizeText(article).includes(normalizeText(itemText));
}

/** 从文本中切出句子列表（按英文句号/感叹号/问号切分，保留句末标点）。 */
export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  const pattern = /[^.!?]+[.!?]+/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    sentences.push(match[0].trim());
    lastIndex = pattern.lastIndex;
  }
  const rest = text.slice(lastIndex).trim();
  if (rest) sentences.push(rest);
  return sentences.filter(Boolean);
}

/**
 * 在文章中找出包含 itemText 的完整句子。
 * 找不到时回退到 itemText 本身。
 */
export function extractSourceSentence(article: string, itemText: string): string {
  const normalizedItem = normalizeText(itemText);
  if (!normalizedItem) return "";
  for (const sentence of splitSentences(article)) {
    if (normalizeText(sentence).includes(normalizedItem)) {
      return sentence;
    }
  }
  return itemText.trim().slice(0, LIMITS.sourceSentenceMax);
}

/** 生成用于文件名的安全 slug（中文等非 ASCII 保留为可读形式）。 */
export function slugify(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return cleaned || "material";
}