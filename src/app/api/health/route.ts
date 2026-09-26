import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: {
    database: "ok" | "error";
    sessionSecret: "configured" | "missing";
  } = {
    database: "error",
    sessionSecret: process.env.SESSION_SECRET ? "configured" : "missing",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (error) {
    console.error("Health check database error:", error);
  }

  const ok = checks.database === "ok" && checks.sessionSecret === "configured";

  return NextResponse.json(
    { ok, checks },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
