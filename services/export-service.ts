import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { slugify } from "@/lib/text";

function escapeYaml(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function getMaterialWithItemsForExport(id: string) {
  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      learningItems: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!material) {
    throw new AppError("材料不存在或已被删除", "MATERIAL_NOT_FOUND");
  }
  return material;
}

/** 生成可直接放入 Obsidian 的 Markdown 内容。 */
export function buildMaterialMarkdown(
  material: Awaited<ReturnType<typeof getMaterialWithItemsForExport>>,
): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`title: "${escapeYaml(material.title)}"`);
  lines.push(`targetLevel: ${material.targetLevel}`);
  lines.push(`sourceLanguage: ${material.sourceLanguage ?? "unknown"}`);
  lines.push(`materialId: ${material.id}`);
  lines.push(`exportedAt: ${new Date().toISOString()}`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${material.title}`);
  lines.push("");
  lines.push("## 目标英语水平");
  lines.push("");
  lines.push(material.targetLevel);
  lines.push("");
  lines.push("## 原始材料");
  lines.push("");
  lines.push("> " + material.originalText.replace(/\n/g, "\n> "));
  lines.push("");
  lines.push("## 改写后的英文文章");
  lines.push("");
  lines.push(material.adaptedText);
  lines.push("");
  lines.push("## 学习内容");
  lines.push("");

  if (material.learningItems.length === 0) {
    lines.push("（暂无学习内容）");
  } else {
    material.learningItems.forEach((item, index) => {
      lines.push(`### ${index + 1}. ${item.itemType}: ${item.text}`);
      lines.push("");
      lines.push(`- 类型：${item.itemType}`);
      lines.push(`- 中文释义：${item.meaningZh || "（未填写）"}`);
      lines.push(`- 英文解释：${item.explanationEn || "（未填写）"}`);
      lines.push(`- 写作示例：${item.writingUsage || "（未填写）"}`);
      lines.push(`- 来源例句：${item.sourceSentence || "（无）"}`);
      lines.push(`- 笔记：${item.notes || "（无）"}`);
      lines.push(`- LearningItem ID：\`${item.id}\``);
      lines.push("");
    });
  }

  return lines.join("\n");
}

export function buildExportFilename(material: { title: string; id: string }): string {
  return `${slugify(material.title)}-${material.id.slice(0, 8)}.md`;
}