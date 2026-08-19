import { notFound } from "next/navigation";
import { AppError } from "@/lib/errors";
import { ReadingView } from "@/components/read/reading-view";
import { getMaterialWithItems } from "@/services/material-service";
import { LEVEL_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let material;
  try {
    material = await getMaterialWithItems(id);
  } catch (error) {
    if (error instanceof AppError) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">{material.title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          {LEVEL_LABELS[material.targetLevel] ?? material.targetLevel}
          {" · "}来源语言：{material.sourceLanguage ?? "unknown"}
          {" · "}
          <a
            href={`/api/materials/${material.id}/export`}
            className="text-text-muted underline decoration-border underline-offset-2 transition-colors duration-150 hover:text-primary"
          >
            导出 Markdown
          </a>
        </p>
      </header>

      <ReadingView
        materialId={material.id}
        adaptedText={material.adaptedText}
        originalText={material.originalText}
        items={material.learningItems}
      />
    </div>
  );
}