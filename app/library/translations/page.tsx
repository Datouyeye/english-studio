import Link from "next/link";
import { listTranslationAttempts } from "@/services/practice-service";

export const dynamic = "force-dynamic";

function formatTime(date: Date): string {
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TranslationHistoryPage() {
  const attempts = await listTranslationAttempts(50);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">翻译历史</h1>
          <p className="mt-1 text-sm text-text-muted">
            你翻译过的句子：题目、最后一版答案与标准答案。
          </p>
        </div>
        <Link href="/practice" className="text-sm text-primary hover:underline">
          ← 回去练习
        </Link>
      </section>

      {attempts.length === 0 ? (
        <p className="text-sm text-text-muted">
          还没有翻译记录。去翻译练习页做完几道题，这里就会显示你的答题历史。
        </p>
      ) : (
        <ul className="space-y-4">
          {attempts.map((a) => (
            <li key={a.id} className="rounded-lg border border-border bg-paper p-5 shadow-card">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-serif text-base leading-relaxed text-text">{a.zhText}</p>
                <span
                  className={`shrink-0 text-xs ${
                    a.passed ? "text-primary" : "text-danger"
                  }`}
                >
                  {a.passed ? `✓ 通过 ${a.score}/5` : `✗ 未通过 ${a.score}/5`}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-text">
                  <span className="mr-2 text-text-muted">我的答案</span>
                  {a.userTranslation || "（空）"}
                </p>
                <p className="text-text-muted">
                  <span className="mr-2 text-text">参考答案</span>
                  {a.referenceTranslation}
                </p>
                {a.feedback ? (
                  <p className="rounded-md bg-highlight/40 px-3 py-2 leading-relaxed text-text">
                    {a.feedback}
                  </p>
                ) : null}
              </div>
              <p className="mt-3 text-xs text-text-muted">更新于 {formatTime(a.updatedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
