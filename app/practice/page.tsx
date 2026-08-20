import { ensureDailySentences, listPracticeSentences } from "@/services/practice-service";
import { PracticeClient } from "@/components/practice/practice-client";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  // 惰性补题：每天第一次打开练习页时自动用 AI 补足 10 条新题
  await ensureDailySentences();
  const sentences = await listPracticeSentences(20);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">翻译练习</h1>
        <p className="mt-2 text-sm text-text-muted">
          看中文 → 翻英文 → 对照参考答案，直到完成度高为止
        </p>
      </header>
      <PracticeClient
        sentences={sentences.map((s) => ({ id: s.id, zhText: s.zhText, scene: s.scene }))}
      />
    </div>
  );
}
