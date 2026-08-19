import Link from "next/link";
import type { listRecentMaterials } from "@/services/material-service";
import { LEVEL_LABELS } from "@/lib/constants";

type Material = Awaited<ReturnType<typeof listRecentMaterials>>[number];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MaterialList({ materials }: { materials: Material[] }) {
  if (materials.length === 0) {
    return <p className="text-sm text-text-muted">还没有生成过材料，先在上方粘贴一段材料试试吧。</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-paper">
      {materials.map((material) => (
        <li key={material.id}>
          <Link
            href={`/materials/${material.id}`}
            className="group flex items-baseline justify-between gap-4 px-4 py-3 transition-colors duration-150 hover:bg-highlight/40"
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] text-text group-hover:text-primary">
                {material.title}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {formatDate(material.createdAt)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-text-muted">
              {LEVEL_LABELS[material.targetLevel] ?? material.targetLevel}
              {material.sourceLanguage ? ` · ${material.sourceLanguage}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}