// Spins up an isolated, throwaway Postgres schema for a test file — never
// touches the app's real database. Each caller gets its own uniquely-named
// schema on the Postgres instance pointed at by DATABASE_URL (or
// TEST_DATABASE_URL, if set), so parallel test files don't collide; the
// schema is dropped in `teardownTestDb`. Requires a reachable Postgres
// instance — see README "Local development database".
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function baseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Set DATABASE_URL (or TEST_DATABASE_URL) to a reachable Postgres instance to run tests.");
  }
  return url;
}

export function setupTestDb(name: string) {
  const schema = `${name.replace(/[^a-zA-Z0-9_]/g, "_")}_${randomUUID().slice(0, 8)}`;
  const base = baseUrl();
  const url = base.includes("?") ? `${base}&schema=${schema}` : `${base}?schema=${schema}`;

  execSync("npx prisma db push --skip-generate", {
    cwd: path.resolve(__dirname, "../.."),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({ datasourceUrl: url });
  return { prisma, url, schema };
}

export async function teardownTestDb(prisma: PrismaClient, schema: string) {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  await prisma.$disconnect();
}
