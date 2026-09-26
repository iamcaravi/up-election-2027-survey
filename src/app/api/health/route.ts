import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    database: "error" as "ok" | "error",
    sessionSecret: process.env.SESSION_SECRET ? ("configured" as const) : ("missing" as const),
    visitorPresence: "error" as "ok" | "error",
    surveys: "error" as "ok" | "error",
  };
  const errors: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    console.error("Health check database error:", error);
    errors.database = error instanceof Error ? error.message : "unknown database error";
  }

  if (checks.database === "ok") {
    try {
      await prisma.visitorPresence.count();
      checks.visitorPresence = "ok";
    } catch (error) {
      console.error("Health check visitorPresence error:", error);
      errors.visitorPresence = error instanceof Error ? error.message : "unknown visitorPresence error";
    }

    try {
      await prisma.survey.count();
      checks.surveys = "ok";
    } catch (error) {
      console.error("Health check survey error:", error);
      errors.surveys = error instanceof Error ? error.message : "unknown survey error";
    }
  }

  const ok =
    checks.database === "ok" &&
    checks.sessionSecret === "configured" &&
    checks.visitorPresence === "ok" &&
    checks.surveys === "ok";

  return NextResponse.json(
    { ok, checks, ...(Object.keys(errors).length ? { errors } : {}) },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
