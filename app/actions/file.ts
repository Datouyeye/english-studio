"use server";

import { LIMITS } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { extractTextFromFile } from "@/services/file-text-service";

export interface ExtractTextActionState {
  text?: string;
  truncated?: boolean;
  error?: string;
}

export async function extractTextFromFileAction(
  formData: FormData,
): Promise<ExtractTextActionState> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "没有收到文件，请重试。" };
  }
  if (file.size > LIMITS.fileSizeMax) {
    return { error: "文件太大，请上传 15MB 以内的文件。" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractTextFromFile({
      name: file.name,
      mimeType: file.type,
      buffer,
    });
    return { text: result.text, truncated: result.truncated };
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    return { error: "读取文件失败，请重试。" };
  }
}