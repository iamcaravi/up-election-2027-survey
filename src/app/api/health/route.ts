import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const checks = {
    database: "error" as "ok" | "error",
    sessionSecret: process.env.SESSION_SECRET ? ("configured" as const) : ("missing" as const),
    visitorPresence: "error" as "ok" | "error",
    surveys: "error" as "ok" | "error",
  };
  // Exact errors stay in the server log; the response only names the failed
  // check so it never leaks connection details or SQL.
  const errors: Record<string, string> = {};
  let databaseLatencyMs: number | null = null;

  try {
    const dbStartedAt = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    databaseLatencyMs = Date.now() - dbStartedAt;
    checks.database = "ok";
  } catch (error) {
    console.error("[api] GET /api/health database check failed:", error);
    errors.database = "DATABASE_UNAVAILABLE";
  }

  if (checks.database === "ok") {
    try {
      await prisma.visitorPresence.count();
      checks.visitorPresence = "ok";
    } catch (error) {
      console.error("[api] GET /api/health visitorPresence check failed:", error);
      errors.visitorPresence = "QUERY_FAILED";
    }

    try {
      await prisma.survey.count();
      checks.surveys = "ok";
    } catch (error) {
      console.error("[api] GET /api/health survey check failed:", error);
      errors.surveys = "QUERY_FAILED";
    }
  }

  const ok =
    checks.database === "ok" &&
    checks.sessionSecret === "configured" &&
    checks.visitorPresence === "ok" &&
    checks.surveys === "ok";

  return NextResponse.json(
    {
      ok,
      checks,
      latencyMs: { database: databaseLatencyMs, total: Date.now() - startedAt },
      ...(Object.keys(errors).length ? { errors } : {}),
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
