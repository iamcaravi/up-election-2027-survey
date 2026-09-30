import { NextRequest, NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { isIsoDate, readAnalysisParams } from "@/lib/analysis-params";
import {
  compareAreas,
  compareOptions,
  crossAnalysis,
  issueDeepDive,
  loadAnalysisContext,
  periodComparison,
  resolveAnalysisScope,
  timeSeries,
} from "@/lib/analysis-engine";
import { isAnalysisModuleEnabled, type AnalysisModuleKey } from "@/lib/analysis-modules";
import { GRANULARITIES, PERIOD_PRESETS, TIME_METRICS, isDimension, type Granularity, type PeriodPreset, type TimeMetric } from "@/lib/analysis-dimensions";
import { isRateLimited } from "@/lib/rate-limit";
import { getClientIp, saltedHash } from "@/lib/hash";

// Lazily loaded Analysis modules. The page renders the summary dashboard
// server-side; the heavier interactive modules (cross-analysis, issue deep
// dive, time/period and area comparisons) are computed here only when a user
// opens them. Every parameter is allow-listed; the output is aggregate-only.

export const dynamic = "force-dynamic";

const MODULE_FLAGS: Record<string, AnalysisModuleKey> = {
  cross: "crossAnalysis",
  issue: "issueIntelligence",
  time: "timeComparison",
  period: "periodComparison",
  "compare-options": "compareAreas",
  compare: "compareAreas",
};

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

function clientKey(req: NextRequest) {
  const ip = getClientIp(req.headers);
  try {
    return saltedHash(ip);
  } catch {
    return ip;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mod = sp.get("module") ?? "";
  const flag = MODULE_FLAGS[mod];
  if (!flag) return bad("unknown_module");
  if (!isAnalysisModuleEnabled(flag)) return bad("module_disabled", 404);
  if (isRateLimited(`analysis-module:${clientKey(req)}`, 120, 60 * 1000)) return bad("rate_limited", 429);

  try {
    const locale = await getServerLocale();
    const { scope: requested, filters } = readAnalysisParams(sp);
    const scope = await resolveAnalysisScope(requested, locale);
    const ctx = await loadAnalysisContext(scope, locale, filters);
    if (!ctx) return NextResponse.json({ data: null }, { headers: { "Cache-Control": "private, max-age=30" } });

    let data: unknown;
    switch (mod) {
      case "cross": {
        const a = sp.get("a");
        const b = sp.get("b");
        if (!isDimension(a) || !isDimension(b)) return bad("invalid_dimension");
        const result = crossAnalysis(ctx, a, b);
        if ("error" in result) return bad(result.error);
        data = result;
        break;
      }
      case "issue": {
        const key = sp.get("issue") ?? "";
        if (!/^[a-z0-9_+-]{1,64}$/i.test(key)) return bad("invalid_issue");
        data = issueDeepDive(ctx, key);
        break;
      }
      case "time": {
        const metric = sp.get("metric") ?? "issues";
        const g = sp.get("granularity") ?? "auto";
        if (!(TIME_METRICS as readonly string[]).includes(metric) || !(GRANULARITIES as readonly string[]).includes(g)) return bad("invalid_time");
        const from = sp.get("from");
        const to = sp.get("to");
        const range = isIsoDate(from ?? undefined) && isIsoDate(to ?? undefined) && from! <= to! ? { from: from!, to: to! } : undefined;
        data = timeSeries(ctx, metric as TimeMetric, g as Granularity, range);
        break;
      }
      case "period": {
        const preset = sp.get("preset") ?? "last7";
        if (!(PERIOD_PRESETS as readonly string[]).includes(preset)) return bad("invalid_preset");
        const result = periodComparison(ctx, preset as PeriodPreset, {
          aFrom: sp.get("aFrom") ?? undefined,
          aTo: sp.get("aTo") ?? undefined,
          bFrom: sp.get("bFrom") ?? undefined,
          bTo: sp.get("bTo") ?? undefined,
        });
        if (!result) return bad("invalid_period");
        data = result;
        break;
      }
      case "compare-options":
        data = compareOptions(ctx);
        break;
      case "compare": {
        const result = compareAreas(ctx, sp.get("x") ?? "", sp.get("y") ?? "");
        if ("error" in result) return bad(result.error);
        data = result;
        break;
      }
    }
    return NextResponse.json({ data }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch (error) {
    console.error(`Analysis module "${mod}" failed:`, error);
    return bad("module_failed", 500);
  }
}
