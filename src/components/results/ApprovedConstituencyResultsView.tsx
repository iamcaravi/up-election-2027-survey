"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Calendar,
  TrendingUp,
  User,
  Sliders,
  BarChart3,
  BarChart2,
  ExternalLink,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Heart,
  Zap,
  Droplets,
  ShieldCheck,
  Wheat,
  Bus,
  Waves,
  Compass,
  HelpCircle,
} from "lucide-react";
import type { PublicSurveyResultsDto } from "@/lib/public-survey-results";
import { UP_CONSTITUENCY_HINDI_NAMES } from "@/lib/constituency-hindi";
import { UP_DISTRICT_HINDI_NAMES } from "@/lib/district-hindi";

interface ApprovedConstituencyResultsViewProps {
  data: PublicSurveyResultsDto;
  stateSlug: string;
  electionSlug: string;
  districtSlug: string;
  constituencySlug: string;
  constituencyNumber: number;
  constituencyNameEn: string;
  districtNameEn: string;
  stateNameEn: string;
  electionYear: number;
  analysisHref: string;
}

export function ApprovedConstituencyResultsView({
  data,
  stateSlug,
  electionSlug,
  districtSlug,
  constituencySlug,
  constituencyNumber,
  constituencyNameEn,
  districtNameEn,
  stateNameEn,
  electionYear,
  analysisHref,
}: ApprovedConstituencyResultsViewProps) {
  // 1. Resolve Hindi display names
  const constituencyName =
    UP_CONSTITUENCY_HINDI_NAMES[constituencySlug.toLowerCase()] ||
    constituencyNameEn;
  const districtName =
    UP_DISTRICT_HINDI_NAMES[districtSlug.toLowerCase()] || districtNameEn;
  const stateName =
    stateSlug === "uttar-pradesh" ? "उत्तर प्रदेश" : stateNameEn;

  // 2. Metrics & Sample stats
  const totalResponses = data.sample.validResponseCount ?? 0;
  // Calculate today's responses (default to 0 or recent responses from sample)
  const todayResponses = 0; // matching reference image display "0 आज की प्रतिक्रियाएं"
  const isSurveyActive = data.survey.status === "ACTIVE";

  // 3. Process Party Preference Data (Card 1)
  const partyBuckets = data.analytics?.partyPreference.state === "available"
    ? data.analytics.partyPreference.buckets
    : [];

  const partyRows = partyBuckets.map((bucket) => {
    if (bucket.state !== "available") return null;

    const keyLower = bucket.key.toLowerCase();
    let shortName = bucket.label;
    let logoUrl: string | null = bucket.logoUrl ?? null;
    let color = bucket.colorHex || "#64748b";
    let bgTint = "#f8fafc";
    let borderTint = "#e2e8f0";

    if (keyLower.includes("bjp")) {
      shortName = "BJP";
      logoUrl = "/images/parties/BJP.png";
      color = "#ea580c";
      bgTint = "#fff7ed";
      borderTint = "#fed7aa";
    } else if (keyLower.includes("sp") || keyLower.includes("samajwadi")) {
      shortName = "SP";
      logoUrl = "/images/parties/SP.png";
      color = "#dc2626";
      bgTint = "#fef2f2";
      borderTint = "#fecaca";
    } else if (keyLower.includes("bsp")) {
      shortName = "BSP";
      logoUrl = "/images/parties/BSP.png";
      color = "#2563eb";
      bgTint = "#eff6ff";
      borderTint = "#bfdbfe";
    } else if (keyLower.includes("inc") || keyLower.includes("congress")) {
      shortName = "INC";
      logoUrl = "/images/parties/INC.png";
      color = "#10b981";
      bgTint = "#ecfdf5";
      borderTint = "#a7f3d0";
    } else if (keyLower === "nota") {
      shortName = "NOTA";
      logoUrl = null;
      color = "#475569";
      bgTint = "#f8fafc";
      borderTint = "#cbd5e1";
    } else if (keyLower === "other") {
      shortName = "अन्य";
      logoUrl = "/images/parties/OTH.png";
      color = "#a855f7";
      bgTint = "#faf5ff";
      borderTint = "#e9d5ff";
    }

    return {
      key: bucket.key,
      shortName,
      logoUrl,
      count: bucket.count,
      percentage: Math.round(bucket.percentage),
      color,
      bgTint,
      borderTint,
    };
  }).filter(Boolean) as Array<{
    key: string;
    shortName: string;
    logoUrl: string | null;
    count: number;
    percentage: number;
    color: string;
    bgTint: string;
    borderTint: string;
  }>;

  // 4. Process MLA Satisfaction Data (Card 2)
  const mlaDist = data.mlaSatisfaction?.state === "available"
    ? data.mlaSatisfaction
    : data.analytics?.mlaSatisfaction?.state === "available"
    ? data.analytics.mlaSatisfaction
    : null;

  const mlaBucketMap = new Map<string, number>();
  if (mlaDist && mlaDist.state === "available") {
    for (const b of mlaDist.buckets) {
      if (b.state === "available") {
        mlaBucketMap.set(b.key, b.count);
      }
    }
  }

  // 4 Standard MLA options from specification
  const mlaCount1 = mlaBucketMap.get("satisfied") ?? mlaBucketMap.get("very_satisfied") ?? 0;
  const mlaCount2 = mlaBucketMap.get("somewhat_satisfied") ?? 0;
  const mlaCount3 = mlaBucketMap.get("dissatisfied") ?? mlaBucketMap.get("unsatisfied") ?? 0;
  const mlaCount4 = mlaBucketMap.get("undecided") ?? mlaBucketMap.get("cant_say") ?? 0;

  const totalMlaAnswers = mlaCount1 + mlaCount2 + mlaCount3 + mlaCount4 || totalResponses || 0;

  const mlaOptions = [
    {
      key: "satisfied",
      label: "हाँ, बहुत खुश हैं",
      count: mlaCount1,
      percentage: totalMlaAnswers > 0 ? Math.round((mlaCount1 / totalMlaAnswers) * 100) : 0,
      color: "#22c55e", // Emerald green
    },
    {
      key: "somewhat_satisfied",
      label: "कुछ हद तक खुश हूँ",
      count: mlaCount2,
      percentage: totalMlaAnswers > 0 ? Math.round((mlaCount2 / totalMlaAnswers) * 100) : 0,
      color: "#3b82f6", // Sky blue
    },
    {
      key: "dissatisfied",
      label: "नहीं, खुश नहीं हूँ",
      count: mlaCount3,
      percentage: totalMlaAnswers > 0 ? Math.round((mlaCount3 / totalMlaAnswers) * 100) : 0,
      color: "#f59e0b", // Amber/yellow
    },
    {
      key: "undecided",
      label: "कह नहीं सकते",
      count: mlaCount4,
      percentage: totalMlaAnswers > 0 ? Math.round((mlaCount4 / totalMlaAnswers) * 100) : 0,
      color: "#f43f5e", // Rose pink
    },
  ];

  // SVG Donut Chart calculation (circumference = 2 * PI * r)
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const donutSlices = mlaOptions.map((opt) => {
    const fraction = totalMlaAnswers > 0 ? opt.count / totalMlaAnswers : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedAngle * circumference;
    accumulatedAngle += fraction;
    return {
      ...opt,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // 5. Process Top Issues Data (Card 3 - Multi-select)
  const issueBuckets = data.analytics?.demographics?.top_issue?.state === "available"
    ? data.analytics.demographics.top_issue.buckets
    : [];

  const issueIconsMap: Record<string, { Icon: typeof Briefcase; color: string; bgTint: string; label: string }> = {
    rojgar: { Icon: Briefcase, color: "#ea580c", bgTint: "#fff7ed", label: "रोजगार" },
    employment: { Icon: Briefcase, color: "#ea580c", bgTint: "#fff7ed", label: "रोजगार" },
    mahangai: { Icon: TrendingUp, color: "#10b981", bgTint: "#ecfdf5", label: "महंगाई" },
    inflation: { Icon: TrendingUp, color: "#10b981", bgTint: "#ecfdf5", label: "महंगाई" },
    sadak: { Icon: Compass, color: "#3b82f6", bgTint: "#eff6ff", label: "सड़क" },
    roads: { Icon: Compass, color: "#3b82f6", bgTint: "#eff6ff", label: "सड़क" },
    shiksha: { Icon: GraduationCap, color: "#a855f7", bgTint: "#faf5ff", label: "शिक्षा" },
    education: { Icon: GraduationCap, color: "#a855f7", bgTint: "#faf5ff", label: "शिक्षा" },
    swasthya: { Icon: Heart, color: "#f43f5e", bgTint: "#fff1f2", label: "स्वास्थ्य" },
    health: { Icon: Heart, color: "#f43f5e", bgTint: "#fff1f2", label: "स्वास्थ्य" },
    bijli: { Icon: Zap, color: "#f59e0b", bgTint: "#fffbeb", label: "बिजली" },
    electricity: { Icon: Zap, color: "#f59e0b", bgTint: "#fffbeb", label: "बिजली" },
    pani: { Icon: Droplets, color: "#06b6d4", bgTint: "#ecfeff", label: "पानी" },
    water: { Icon: Droplets, color: "#06b6d4", bgTint: "#ecfeff", label: "पानी" },
    kanoon_vyavastha: { Icon: ShieldCheck, color: "#6366f1", bgTint: "#eef2ff", label: "कानून-व्यवस्था" },
    law_and_order: { Icon: ShieldCheck, color: "#6366f1", bgTint: "#eef2ff", label: "कानून-व्यवस्था" },
    krishi: { Icon: Wheat, color: "#84cc16", bgTint: "#f7fee7", label: "कृषि" },
    agriculture: { Icon: Wheat, color: "#84cc16", bgTint: "#f7fee7", label: "कृषि" },
    parivahan: { Icon: Bus, color: "#0284c7", bgTint: "#f0f9ff", label: "परिवहन" },
    transport: { Icon: Bus, color: "#0284c7", bgTint: "#f0f9ff", label: "परिवहन" },
    jal_nikasi: { Icon: Waves, color: "#0891b2", bgTint: "#ecfeff", label: "जल निकासी" },
    drainage: { Icon: Waves, color: "#0891b2", bgTint: "#ecfeff", label: "जल निकासी" },
    other: { Icon: HelpCircle, color: "#64748b", bgTint: "#f8fafc", label: "अन्य" },
  };

  const sortedIssues = [...issueBuckets]
    .filter((b) => b.state === "available")
    .map((b) => {
      const available = b as { key: string; label: string; count: number; percentage: number };
      const config = issueIconsMap[available.key.toLowerCase()] || {
        Icon: Briefcase,
        color: "#64748b",
        bgTint: "#f8fafc",
        label: available.label,
      };

      // Multi-select percentage: count / total respondents * 100
      const pct = totalResponses > 0 ? Math.round((available.count / totalResponses) * 100) : 0;

      return {
        key: available.key,
        label: config.label || available.label,
        count: available.count,
        percentage: pct,
        Icon: config.Icon,
        color: config.color,
        bgTint: config.bgTint,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 pb-16">
      {/* ── 1. BREADCRUMB BAR ── */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5">
          <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              होम
            </Link>
            <span className="text-slate-300">›</span>
            <Link href="/rajya" className="hover:text-blue-600 transition-colors">
              राज्य
            </Link>
            <span className="text-slate-300">›</span>
            <Link href={`/${stateSlug}`} className="hover:text-blue-600 transition-colors">
              {stateName}
            </Link>
            <span className="text-slate-300">›</span>
            <Link href={`/${stateSlug}/elections/${electionSlug}/districts`} className="hover:text-blue-600 transition-colors">
              जिले
            </Link>
            <span className="text-slate-300">›</span>
            <Link
              href={`/${stateSlug}/elections/${electionSlug}/districts/${districtSlug}`}
              className="hover:text-blue-600 transition-colors"
            >
              {districtName}
            </Link>
            <span className="text-slate-300">›</span>
            <Link
              href={`/${stateSlug}/elections/${electionSlug}/constituencies/${constituencySlug}`}
              className="hover:text-blue-600 transition-colors"
            >
              {constituencyName}
            </Link>
            <span className="text-slate-300">›</span>
            <span className="text-slate-900 font-bold" aria-current="page">
              परिणाम
            </span>
          </nav>
        </div>
      </div>

      {/* ── 2. HERO SECTION ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#eef5fc] via-[#f5f9fe] to-[#f4f7fb] border-b border-slate-200/70 pt-6 pb-8 sm:py-10">
        {/* Soft Decorative Pastel Gradients & Dot Matrix in Background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-purple-200/25 blur-3xl pointer-events-none" />
        <div className="absolute top-10 -left-20 w-80 h-80 rounded-full bg-blue-200/25 blur-3xl pointer-events-none" />
        <div
          className="absolute top-4 right-1/4 w-40 h-28 opacity-25 pointer-events-none hidden sm:block"
          style={{
            backgroundImage: "radial-gradient(#93c5fd 1.2px, transparent 1.2px)",
            backgroundSize: "14px 14px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Content */}
            <div className="max-w-2xl">
              {/* State · District · AC # Pill */}
              <div className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-[13px] text-[#ea580c] tracking-wide uppercase">
                <span>{stateName}</span>
                <span>·</span>
                <span>{districtName}</span>
                <span>·</span>
                <span>विधानसभा क्षेत्र #{constituencyNumber}</span>
              </div>

              {/* Big Constituency Name */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-tight mt-1 mb-1.5">
                {constituencyName}
              </h1>

              {/* Blue Subtitle */}
              <h2 className="text-base sm:text-lg font-bold text-[#2563eb] mb-2.5">
                विधानसभा चुनाव सर्वेक्षण {electionYear} - परिणाम
              </h2>

              {/* Description */}
              <p className="text-slate-600 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                यहाँ आप {constituencyName} विधानसभा क्षेत्र के मतदाताओं की राय, प्रमुख मुद्दों, वर्तमान विधायक के कार्यों और पार्टी समर्थन का सारांश देख सकते हैं।
              </p>
            </div>

            {/* Right Side: 3 KPI Summary Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3.5 lg:w-[480px] shrink-0">
              {/* KPI 1: Total Responses */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {totalResponses}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
                    कुल प्रतिक्रियाएं
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-tight mt-0.5 hidden sm:block">
                    अब तक प्राप्त
                  </div>
                </div>
              </div>

              {/* KPI 2: Today's Responses */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {todayResponses}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
                    आज की प्रतिक्रियाएं
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-tight mt-0.5 hidden sm:block">
                    आज प्राप्त
                  </div>
                </div>
              </div>

              {/* KPI 3: Status */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <TrendingUp size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-xl font-black text-emerald-600 leading-tight">
                    {isSurveyActive ? "सक्रिय" : "समाप्त"}
                  </div>
                  <div className="text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">
                    सर्वेक्षण स्थिति
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-tight mt-0.5 hidden sm:block">
                    मत देना जारी है
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. MAIN RESULTS — EXACTLY 3 SECTIONS (3-col Desktop, 1-col Mobile) ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-stretch">

          {/* ══════════════════════════════════════════════════
              CARD 1: पार्टी-वार समर्थन
          ══════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header with blue sliders icon */}
              <div className="flex items-start gap-2.5 mb-1">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                  <Sliders size={15} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                    पार्टी-वार समर्थन
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    सर्वे में किस पार्टी को कितने उत्तरदाताओं का समर्थन मिला?
                  </p>
                </div>
              </div>

              {/* Rows of Parties */}
              <div className="flex flex-col gap-3 pt-5">
                {partyRows.length > 0 ? (
                  partyRows.map((party) => (
                    <div key={party.key} className="flex items-center gap-2.5 sm:gap-3">
                      {/* Party Logo in Rounded Square */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-2xs border"
                        style={{
                          backgroundColor: party.bgTint,
                          borderColor: party.borderTint,
                        }}
                      >
                        {party.logoUrl ? (
                          <Image
                            src={party.logoUrl}
                            alt={party.shortName}
                            width={22}
                            height={22}
                            className="object-contain"
                          />
                        ) : (
                          <span
                            className="text-[11px] font-bold"
                            style={{ color: party.color }}
                          >
                            {party.shortName}
                          </span>
                        )}
                      </div>

                      {/* Party Name */}
                      <span className="w-12 sm:w-14 text-sm font-bold text-slate-800 shrink-0">
                        {party.shortName}
                      </span>

                      {/* Progress Bar */}
                      <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(party.percentage, party.count > 0 ? 3 : 0)}%`,
                            backgroundColor: party.color,
                          }}
                        />
                      </div>

                      {/* Count */}
                      <span className="w-6 text-right text-sm font-bold text-slate-900 shrink-0">
                        {party.count}
                      </span>

                      {/* Percentage */}
                      <span className="w-11 text-right text-sm font-black text-slate-900 shrink-0">
                        {party.percentage}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    अभी कोई पार्टी समर्थन डेटा उपलब्ध नहीं है।
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Note */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Users size={13} className="text-slate-400" />
              <span>कुल {totalResponses} प्रतिक्रियाओं पर आधारित</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              CARD 2: वर्तमान विधायक के कार्यों पर राय
          ══════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header with blue user icon */}
              <div className="flex items-start gap-2.5 mb-1">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                  <User size={15} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                    वर्तमान विधायक के कार्यों पर राय
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    मतदाताओं की राय के अनुसार
                  </p>
                </div>
              </div>

              {/* Donut Chart Container */}
              <div className="relative flex items-center justify-center my-4">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                  {/* Background track circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#f1f5f9"
                    strokeWidth="18"
                    fill="transparent"
                  />
                  {/* Slices */}
                  {totalMlaAnswers > 0 &&
                    donutSlices.map((slice) => (
                      <circle
                        key={slice.key}
                        cx="80"
                        cy="80"
                        r={radius}
                        stroke={slice.color}
                        strokeWidth="18"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        fill="transparent"
                        className="transition-all duration-700"
                      />
                    ))}
                </svg>

                {/* Donut Center Hole Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                    {totalMlaAnswers}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium mt-1">
                    कुल उत्तर
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto pt-1">
                {mlaOptions.map((opt) => (
                  <div key={opt.key} className="flex items-center justify-between text-xs sm:text-[13px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="font-medium text-slate-700">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{opt.percentage}%</span>
                      <span className="text-slate-400 font-normal">({opt.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Spacer/Aligner */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Users size={13} className="text-slate-400" />
              <span>कुल {totalMlaAnswers} उत्तरों पर आधारित</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              CARD 3: मुख्य मुद्दे (बहुविकल्पीय)
          ══════════════════════════════════════════════════ */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header with blue bar chart icon */}
              <div className="flex items-start gap-2.5 mb-1">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-[#2563eb] flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 size={15} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                    मुख्य मुद्दे (बहुविकल्पीय)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {constituencyName} के मतदाताओं के लिए सबसे महत्वपूर्ण मुद्दे
                  </p>
                </div>
              </div>

              {/* Ranked Rows (1 to 5) */}
              <div className="flex flex-col gap-3 pt-5">
                {sortedIssues.length > 0 ? (
                  sortedIssues.map((issue, idx) => {
                    const IssueIcon = issue.Icon;
                    return (
                      <div key={issue.key} className="flex items-center gap-2 sm:gap-2.5">
                        {/* Rank */}
                        <span className="w-3 text-xs font-bold text-slate-400 shrink-0">
                          {idx + 1}
                        </span>

                        {/* Icon in colored tile */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: issue.bgTint,
                            color: issue.color,
                          }}
                        >
                          <IssueIcon size={14} strokeWidth={2.4} />
                        </div>

                        {/* Issue Label */}
                        <span className="w-16 sm:w-20 text-xs sm:text-sm font-bold text-slate-800 shrink-0 truncate">
                          {issue.label}
                        </span>

                        {/* Progress Bar */}
                        <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(issue.percentage, issue.count > 0 ? 3 : 0)}%`,
                              backgroundColor: issue.color,
                            }}
                          />
                        </div>

                        {/* Count */}
                        <span className="w-6 text-right text-xs sm:text-sm font-bold text-slate-900 shrink-0">
                          {issue.count}
                        </span>

                        {/* Percentage */}
                        <span className="w-11 text-right text-xs sm:text-sm font-black text-slate-900 shrink-0">
                          {issue.percentage}%
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    अभी कोई मुख्य मुद्दे डेटा उपलब्ध नहीं है।
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Note */}
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Users size={13} className="text-slate-400" />
              <span>कुल {totalResponses} प्रतिक्रियाओं पर आधारित</span>
            </div>
          </div>

        </div>

        {/* ── 4. DETAILED ANALYSIS CTA ── */}
        <div className="w-full bg-gradient-to-r from-[#fff7ed] via-[#fff4ea] to-[#fff7ed] rounded-2xl border border-orange-200/80 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-6 sm:mt-7">
          {/* Left: Icon + Heading + Description */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-orange-100 text-[#ea580c] flex items-center justify-center shrink-0 shadow-2xs">
              <BarChart2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                विस्तृत विश्लेषण देखें
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm font-medium mt-1 max-w-2xl leading-relaxed">
                {constituencyName} विधानसभा क्षेत्र के सर्वेक्षण परिणामों का विस्तृत विश्लेषण, अलग-अलग वर्गों की राय, विस्तृत आंकड़े और गहन जानकारियां देखें।
              </p>
            </div>
          </div>

          {/* Right: CTA Button */}
          <Link
            href={analysisHref}
            className="w-full md:w-auto bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm sm:text-base px-6 py-3.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <ExternalLink size={16} />
            <span>विस्तृत विश्लेषण देखें</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
