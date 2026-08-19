import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractTextFromFile } from "@/services/file-text-service";
import { AppError } from "@/lib/errors";

const fixtures = path.resolve(process.cwd(), "tests/fixtures");

describe("extractTextFromFile", () => {
  it("读取 UTF-8 TXT", async () => {
    const buffer = Buffer.from("Hello 你好，这是测试文本。", "utf8");
    const result = await extractTextFromFile({
      name: "test.txt",
      mimeType: "text/plain",
      buffer,
    });
    expect(result.text).toContain("你好");
    expect(result.truncated).toBe(false);
    expect(result.format).toBe("txt");
  });

  it("TXT 含乱码时回退 GBK 解码", async () => {
    // GBK 编码的“中文测试”
    const gbk = Buffer.from([0xd6, 0xd0, 0xce, 0xc4, 0xb2, 0xe2, 0xca, 0xd4]);
    const result = await extractTextFromFile({
      name: "gbk.txt",
      mimeType: "text/plain",
      buffer: gbk,
    });
    expect(result.text).toContain("中文测试");
  });

  it("读取文字版 PDF", async () => {
    const buffer = fs.readFileSync(path.join(fixtures, "sample.pdf"));
    const result = await extractTextFromFile({
      name: "sample.pdf",
      mimeType: "application/pdf",
      buffer,
    });
    expect(result.text).toContain("Hello PDF fixture text");
    expect(result.format).toBe("pdf");
  });

  it("读取 docx", async () => {
    const buffer = fs.readFileSync(path.join(fixtures, "sample.docx"));
    const result = await extractTextFromFile({
      name: "sample.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      buffer,
    });
    expect(result.text).toContain("docx fixture");
    expect(result.format).toBe("docx");
  });

  it("拒绝不支持的格式", async () => {
    await expect(
      extractTextFromFile({
        name: "a.png",
        mimeType: "image/png",
        buffer: Buffer.from("x"),
      }),
    ).rejects.toThrow(AppError);
  });

  it("超长文本自动截断", async () => {
    const long = "a".repeat(30_000);
    const result = await extractTextFromFile({
      name: "long.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(long),
    });
    expect(result.truncated).toBe(true);
    expect(result.text.length).toBeLessThanOrEqual(20_000);
  });
});