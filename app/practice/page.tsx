import { preparePracticePage } from "@/services/practice-service";
import { PracticeClient } from "@/components/practice/practice-client";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  // 补题失败时静默降级：页面照常打开，只影响"今日新增"提示
  const { sentences, todayCount } = await preparePracticePage(20);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">翻译练习</h1>
        <p className="mt-2 text-sm text-text-muted">
          看中文 → 翻英文 → 对照参考答案，直到完成度高为止
        </p>
      </header>
      <PracticeClient
        sentences={sentences.map((s) => ({ id: s.id, zhText: s.zhText, scene: s.scene }))}
        todayCount={todayCount}
      />
    </div>
  );
}
