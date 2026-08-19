import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * 将 DATABASE_URL 解析为 @prisma/adapter-better-sqlite3 可用的 url。
 * 该适配器会去掉 "file:" 前缀并把剩余部分当作 better-sqlite3 路径，
 * 因此相对路径统一解析为 "file:" + 绝对路径（不要转成 file:// URL）。
 */
export function resolveSqliteUrl(url: string = process.env.DATABASE_URL ?? "file:./dev.db"): string {
  if (!url.startsWith("file:")) return url;
  const rest = url.slice("file:".length);
  if (rest === ":memory:" || rest === "") return "file::memory:";
  // 已是绝对路径形式（file:C:/... 或 file:/...）
  if (/^[a-zA-Z]:[\\/]/.test(rest) || rest.startsWith("/")) return url;
  const rel = rest.replace(/^\.?\//, "");
  return `file:${path.resolve(/* turbopackIgnore: true */ process.cwd(), rel)}`;
}

export function createPrismaClient(url?: string): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: resolveSqliteUrl(url) });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { __prismaClient?: PrismaClient };

/** 开发环境热重载时复用同一个 PrismaClient 实例。 */
export function getPrismaSingleton(): PrismaClient {
  if (!globalForPrisma.__prismaClient) {
    globalForPrisma.__prismaClient = createPrismaClient();
  }
  return globalForPrisma.__prismaClient;
}