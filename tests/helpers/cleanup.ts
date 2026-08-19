import { prisma } from "@/lib/db";

/** 清空测试库数据（保留表结构）。 */
export async function cleanDatabase() {
  await prisma.practiceSentence.deleteMany();
  await prisma.learningItem.deleteMany();
  await prisma.material.deleteMany();
}