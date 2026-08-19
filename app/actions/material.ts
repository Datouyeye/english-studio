"use server";

import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";
import { generateMaterialInputSchema } from "@/lib/schemas/material";
import { generateMaterial } from "@/services/material-service";

export interface GenerateMaterialState {
  error?: string;
}

export async function generateMaterialAction(
  _prevState: GenerateMaterialState | undefined,
  formData: FormData,
): Promise<GenerateMaterialState> {
  const parsed = generateMaterialInputSchema.safeParse({
    title: formData.get("title") ?? "",
    originalText: formData.get("originalText") ?? "",
    targetLevel: formData.get("targetLevel") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入不合法，请检查后重试。" };
  }

  let id: string;
  try {
    ({ id } = await generateMaterial(parsed.data));
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    return { error: "生成失败，请稍后重试。" };
  }

  redirect(`/materials/${id}`);
}