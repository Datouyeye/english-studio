import { MaterialForm } from "@/components/home/material-form";
import { MaterialList } from "@/components/home/material-list";
import { listRecentMaterials } from "@/services/material-service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const materials = await listRecentMaterials(10);

  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-2xl">
        <h1 className="text-center text-2xl font-semibold tracking-tight">
          把材料改写成适合你的英文文章
        </h1>
        <MaterialForm />
      </section>

      <section className="mx-auto max-w-2xl">
        <h2 className="mb-4 text-sm font-medium text-text-muted">最近生成的材料</h2>
        <MaterialList materials={materials} />
      </section>
    </div>
  );
}