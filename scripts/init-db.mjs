// 预创建 SQLite 数据库文件（Prisma schema engine 在本机无法新建文件时使用）。
// 用法：node scripts/init-db.mjs
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const rel = url.startsWith("file:") ? url.slice("file:".length) : null;

if (rel && rel !== ":memory:" && !rel.startsWith("///") && !/^[a-zA-Z]:[\\/]/.test(rel)) {
  const dbPath = path.resolve(process.cwd(), rel.replace(/^\.?\//, ""));
  const root = path.resolve(process.cwd());
  if (!dbPath.startsWith(root)) {
    console.error(`拒绝写入项目目录之外的数据库路径：${dbPath}`);
    process.exit(1);
  }
  const db = new Database(dbPath);
  db.close();
  console.log(`SQLite 数据库已就绪：${dbPath}`);
} else {
  console.log("DATABASE_URL 未指向本地文件数据库，跳过预创建。");
}