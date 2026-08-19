import { describe, expect, it } from "vitest";
import {
  containsText,
  extractSourceSentence,
  normalizeText,
  slugify,
  splitSentences,
} from "@/lib/text";

describe("normalizeText", () => {
  it("去除首尾空白、小写并压缩空白", () => {
    expect(normalizeText("  Hello   World ")).toBe("hello world");
  });
});

describe("containsText", () => {
  it("大小写与空白不敏感地判断包含关系", () => {
    expect(containsText("She has a good habit. It helps.", "good habit")).toBe(true);
    expect(containsText("She has a good habit.", "bad habit")).toBe(false);
  });
});

describe("splitSentences", () => {
  it("按句末标点切分并保留标点", () => {
    const text = "First sentence. Second one! Is this a question? Yes.";
    expect(splitSentences(text)).toEqual([
      "First sentence.",
      "Second one!",
      "Is this a question?",
      "Yes.",
    ]);
  });
});

describe("extractSourceSentence", () => {
  it("返回包含表达式的完整句子", () => {
    const article = "She has a good habit. It helps her every day.";
    expect(extractSourceSentence(article, "habit")).toBe("She has a good habit.");
  });

  it("找不到时回退到表达式本身", () => {
    expect(extractSourceSentence("Nothing here.", "missing phrase")).toBe("missing phrase");
  });
});

describe("slugify", () => {
  it("生成安全文件名", () => {
    expect(slugify('A: "Fun" Story / Test!')).toBe("A-Fun-Story-Test!");
  });
});