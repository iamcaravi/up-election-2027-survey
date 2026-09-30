import { NextRequest, NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { readAnalysisParams } from "@/lib/analysis-params";
import { loadAnalysisContext, resolveAnalysisScope } from "@/lib/analysis-engine";
import { MAX_QUESTION_LENGTH, askData } from "@/lib/analysis-ask";
import { isAnalysisModuleEnabled } from "@/lib/analysis-modules";
import { isRateLimited } from "@/lib/rate-limit";
import { getClientIp, saltedHash } from "@/lib/hash";

// "डेटा से पूछें": POST { question } with the page's scope/filters in the
// query string. Answers come only from aggregated survey responses (see
// src/lib/analysis-ask.ts); questions are not stored.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAnalysisModuleEnabled("askData")) return NextResponse.json({ error: "module_disabled" }, { status: 404 });
  const ip = getClientIp(req.headers);
  let key = ip;
  try {
    key = saltedHash(ip);
  } catch {}
  if (isRateLimited(`analysis-ask:${key}`, 20, 60 * 1000)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let question = "";
  try {
    const body = (await req.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.slice(0, MAX_QUESTION_LENGTH) : "";
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const locale = await getServerLocale();
    const { scope: requested, filters } = readAnalysisParams(req.nextUrl.searchParams);
    const scope = await resolveAnalysisScope(requested, locale);
    const ctx = await loadAnalysisContext(scope, locale, filters);
    if (!ctx)
      return NextResponse.json({
        data: {
          status: "insufficient",
          heading: locale === "hi" ? "पर्याप्त डेटा नहीं" : "Not enough data",
          lines: [locale === "hi" ? "उपलब्ध डेटा इस प्रश्न का विश्वसनीय उत्तर देने के लिए पर्याप्त नहीं है।" : "The available data is not sufficient to answer this question reliably."],
          understood: [],
        },
      });
    return NextResponse.json({ data: askData(ctx, question) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Analysis ask failed:", error);
    return NextResponse.json({ error: "ask_failed" }, { status: 500 });
  }
}
