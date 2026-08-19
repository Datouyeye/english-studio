import { createPrismaClient } from "../lib/prisma-client";

async function main() {
  const prisma = createPrismaClient();
  try {
    const count = await prisma.material.count();
    if (count > 0) {
      console.log("数据库已有数据，跳过 seed。");
      return;
    }

    const material = await prisma.material.create({
      data: {
        title: "Demo: A Healthy Morning Routine",
        originalText:
          "早起后喝一杯温水，然后简单拉伸十分钟，再吃一顿营养均衡的早餐，会让你一整天都更有精神。",
        adaptedText:
          "Starting the day with a glass of warm water is a simple habit. After that, you can stretch for ten minutes to wake up your body. Then enjoy a balanced breakfast with protein, fruit, and grains. These small steps can give you more energy for the whole day.",
        targetLevel: "CET6",
        sourceLanguage: "zh",
        learningItems: {
          create: [
            {
              text: "habit",
              normalizedText: "habit",
              itemType: "word",
              meaningZh: "习惯",
              explanationEn: "something you do often and regularly",
              writingUsage:
                "Example: Developing a good habit takes time. Use it when discussing daily routines or self-improvement.",
              sourceSentence:
                "Starting the day with a glass of warm water is a simple habit.",
              sourceType: "ai",
              sortOrder: 0,
            },
            {
              text: "balanced breakfast",
              normalizedText: "balanced breakfast",
              itemType: "phrase",
              meaningZh: "营养均衡的早餐",
              explanationEn: "a morning meal with the right mix of foods",
              writingUsage:
                "Example: A balanced breakfast gives you energy for the day. Use it when writing about health or lifestyle.",
              sourceSentence:
                "Then enjoy a balanced breakfast with protein, fruit, and grains.",
              sourceType: "ai",
              sortOrder: 1,
            },
            {
              text: "give you more energy",
              normalizedText: "give you more energy",
              itemType: "phrase",
              meaningZh: "让你更有精力",
              explanationEn: "make you feel more active and awake",
              writingUsage:
                "Example: These habits can give you more energy. Use it to describe positive effects or benefits.",
              sourceSentence:
                "These small steps can give you more energy for the whole day.",
              sourceType: "ai",
              sortOrder: 2,
            },
          ],
        },
      },
    });

    console.log(`Seed 完成，示例材料 ID：${material.id}`);
    console.log("运行 pnpm dev 后可在首页看到该示例。");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Seed 失败：", error);
  process.exit(1);
});