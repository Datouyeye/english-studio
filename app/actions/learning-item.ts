"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import {
  addLearningItemInputSchema,
  deleteLearningItemInputSchema,
  updateLearningItemInputSchema,
  type AddLearningItemInput,
  type DeleteLearningItemInput,
  type UpdateLearningItemInput,
} from "@/lib/schemas/learning-item";
import {
  addManualLearningItem,
  deleteLearningItem,
  updateLearningItem,
} from "@/services/learning-item-service";

export interface LearningItemActionState {
  error?: string;
  success?: boolean;
}

function revalidateAffectedPaths(materialId?: string | null) {
  if (materialId) {
    revalidatePath(`/materials/${materialId}`);
  }
  revalidatePath("/library");
  revalidatePath("/review");
}

export async function addLearningItemAction(
  input: AddLearningItemInput,
): Promise<LearningItemActionState> {
  const parsed = addLearningItemInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入不合法" };
  }

  try {
    await addManualLearningItem(parsed.data);
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    return { error: "添加失败，请稍后重试。" };
  }

  revalidateAffectedPaths(parsed.data.materialId);
  return { success: true };
}

export async function updateLearningItemAction(
  input: UpdateLearningItemInput,
): Promise<LearningItemActionState> {
  const parsed = updateLearningItemInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入不合法" };
  }

  try {
    await updateLearningItem(parsed.data);
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    return { error: "保存失败，请稍后重试。" };
  }

  revalidateAffectedPaths();
  return { success: true };
}

export async function deleteLearningItemAction(
  input: DeleteLearningItemInput,
): Promise<LearningItemActionState> {
  const parsed = deleteLearningItemInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入不合法" };
  }

  try {
    await deleteLearningItem(parsed.data.id);
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message };
    }
    return { error: "删除失败，请稍后重试。" };
  }

  revalidateAffectedPaths();
  return { success: true };
}