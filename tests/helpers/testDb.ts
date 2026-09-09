// Spins up an isolated, throwaway SQLite database for a test file — never
// touches prisma/dev.db (the real, seeded database). Each caller gets its
// own uniquely-named .db file so parallel test files don't collide; the file
// is deleted in `teardownTestDb`.
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

export function setupTestDb(name: string) {
  const dbPath = path.resolve(__dirname, `../../prisma/${name}.db`);
  if (existsSync(dbPath)) unlinkSync(dbPath);
  const url = `file:${dbPath}`;

  execSync("npx prisma db push --skip-generate", {
    cwd: path.resolve(__dirname, "../.."),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({ datasourceUrl: url });
  return { prisma, dbPath };
}

export async function teardownTestDb(prisma: PrismaClient, dbPath: string) {
  await prisma.$disconnect();
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    const p = dbPath + suffix;
    if (existsSync(p)) unlinkSync(p);
  }
}
