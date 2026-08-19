import { AppError } from "@/lib/errors";
import {
  buildExportFilename,
  buildMaterialMarkdown,
  getMaterialWithItemsForExport,
} from "@/services/export-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const material = await getMaterialWithItemsForExport(id);
    const markdown = buildMaterialMarkdown(material);
    const filename = buildExportFilename(material);
    // HTTP 响应头不允许非 ASCII 字符：filename 用英文兜底名，
    // 真实文件名（可能含中文）通过 RFC 5987 的 filename*（UTF-8 编码后为 ASCII）下发。
    const asciiFallback = `material-${material.id.slice(0, 8)}.md`;
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return new Response(error.message, { status: 404 });
    }
    return new Response("导出失败，请稍后重试。", { status: 500 });
  }
}