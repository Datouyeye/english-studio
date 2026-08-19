import { Suspense } from "react";
import { LibraryFilters } from "@/components/library/library-filters";
import { LibraryItemRow } from "@/components/library/library-item-row";
import {
  listLearningItems,
  listMaterialsForFilter,
} from "@/services/learning-item-service";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; materialId?: string }>;
}) {
  const { search, materialId } = await searchParams;
  const [items, materials] = await Promise.all([
    listLearningItems({ search, materialId }),
    listMaterialsForFilter(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">学习库</h1>
        <p className="mt-1 text-sm text-text-muted">查看、搜索并管理你收藏的全部英语表达。</p>
      </section>

      <Suspense fallback={<div className="h-12" />}>
        <LibraryFilters materials={materials} />
      </Suspense>

      <section>
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">
            没有找到学习内容。去阅读页选中文本，或生成一篇新文章试试吧。
          </p>
        ) : (
          <ul className="rounded-lg border border-border bg-paper px-5">
            {items.map((item) => (
              <LibraryItemRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}