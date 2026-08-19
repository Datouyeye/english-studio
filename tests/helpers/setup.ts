import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

/** 集成测试使用独立 SQLite 文件，避免污染开发库。 */
export const TEST_DB_PATH = path.resolve(process.cwd(), "tests/test.db");

function createTestDatabase() {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.rmSync(TEST_DB_PATH);
  }
  const db = new Database(TEST_DB_PATH);
  const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");
  const dirs = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  for (const dir of dirs) {
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    if (fs.existsSync(sqlPath)) {
      db.exec(fs.readFileSync(sqlPath, "utf8"));
    }
  }
  db.close();
}

createTestDatabase();
process.env.DATABASE_URL = `file:${TEST_DB_PATH.replace(/\\/g, "/")}`;