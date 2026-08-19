"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LibraryFilters({
  materials,
}: {
  materials: { id: string; title: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const materialId = searchParams.get("materialId") ?? "";

  const applyFilters = (nextSearch: string, nextMaterialId: string) => {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    if (nextMaterialId) params.set("materialId", nextMaterialId);
    const query = params.toString();
    router.replace(query ? `/library?${query}` : "/library");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") applyFilters(search, materialId);
        }}
        placeholder="搜索表达、释义、例句…"
        className="input min-w-0 flex-1"
      />
      <select
        value={materialId}
        onChange={(event) => applyFilters(search, event.target.value)}
        className="input w-auto cursor-pointer"
      >
        <option value="">全部来源文章</option>
        {materials.map((material) => (
          <option key={material.id} value={material.id}>
            {material.title}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          setSearch("");
          applyFilters("", "");
        }}
        className="btn btn-ghost px-2 py-2"
      >
        清除筛选
      </button>
    </div>
  );
}