import Link from "next/link";
import { listItemsForReview, type ReviewMode } from "@/services/learning-item-service";
import { ReviewDeck } from "@/components/review/review-deck";

export const dynamic = "force-dynamic";

const modes: { value: ReviewMode; label: string }[] = [
  { value: "newest", label: "从新到旧" },
  { value: "random", label: "随机顺序" },
];

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode: rawMode } = await searchParams;
  const mode: ReviewMode = rawMode === "random" ? "random" : "newest";
  const items = await listItemsForReview(mode);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">卡片复习</h1>
        <div className="segmented mt-4" role="tablist" aria-label="复习模式">
          {modes.map((item) => (
            <Link
              key={item.value}
              href={`/review?mode=${item.value}`}
              role="tab"
              aria-selected={mode === item.value}
              className={
                mode === item.value ? "segmented-item segmented-item-active" : "segmented-item"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <ReviewDeck items={items} />
    </div>
  );
}