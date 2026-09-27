"use client";

import Link from "next/link";
import {
  Users,
  Shield,
  UserCheck,
  User,
  BarChart2,
  MapPin,
  Clock,
  CheckCircle2,
  TrendingUp,
  Info,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Landmark,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import type { CurrentMlaInfo } from "@/lib/current-mla";

/* ─────────────────────── Types ─────────────────────── */
export interface ConstituencyDetailPageProps {
  stateName: string;
  stateHref: string;
  districtName: string;
  districtHref: string;
  constituencyName: string;
  constituencyNumber: number;
  reservedStatus: string;
  currentMlaInfo: CurrentMlaInfo | null;
  responseCount: number;
  surveyHref: string;
  resultsHref: string;
  hasSurvey: boolean;
  todayResponseCount?: number;
}

/* ─────────────────────── Helpers ─────────────────────── */
function reservedLabel(status: string, hi: boolean): string {
  if (status === "SC") return "SC आरक्षित";
  if (status === "ST") return "ST आरक्षित";
  return hi ? "अनारक्षित" : "Unreserved";
}

/* ────────────────── CSS Clipboard Graphic ────────────────── */
function SurveyClipboardGraphic() {
  return (
    <div className="relative shrink-0 w-28 h-36 rounded-2xl bg-white p-3.5 shadow-sm border border-slate-100 flex flex-col justify-center gap-2.5">
      {/* Top blue tab */}
      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-10 rounded-full bg-blue-200/60" />
      {/* Item 1: Blue check */}
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#2563eb] text-white">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="2 6 4.8 9 10 3" />
          </svg>
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-4/5 rounded-full bg-blue-100" />
          <div className="h-1 w-1/2 rounded-full bg-slate-100" />
        </div>
      </div>
      {/* Item 2: Green check */}
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#10b981] text-white">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="2 6 4.8 9 10 3" />
          </svg>
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-full rounded-full bg-emerald-100" />
          <div className="h-1 w-3/5 rounded-full bg-slate-100" />
        </div>
      </div>
      {/* Item 3: Orange check */}
      <div className="flex items-center gap-2">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#f97316] text-white">
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="2 6 4.8 9 10 3" />
          </svg>
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-3/4 rounded-full bg-orange-100" />
          <div className="h-1 w-2/5 rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Main Component ─────────────────────── */
export function ConstituencyDetailPage({
  stateName,
  stateHref,
  districtName,
  districtHref,
  constituencyName,
  constituencyNumber,
  reservedStatus,
  currentMlaInfo,
  responseCount,
  surveyHref,
  resultsHref,
  hasSurvey,
  todayResponseCount = 0,
}: ConstituencyDetailPageProps) {
  const { locale } = useLocale();
  const hi = locale === "hi";

  const mlaName = currentMlaInfo?.name ?? null;
  const mlaHindi = currentMlaInfo?.nameHindi ?? null;
  const mlaParty = currentMlaInfo?.partyShortName ?? null;

  // MLA values matching reference specification:
  // If exists: "Ajay", sub: "BJP"
  // If not: "विधायक दर्ज नहीं", sub: "इस विधानसभा क्षेत्र के विधायक अभी दर्ज नहीं हैं"
  const mlaDisplay =
    mlaName
      ? hi && mlaHindi
        ? mlaHindi
        : mlaName
      : hi
      ? "विधायक दर्ज नहीं"
      : "MLA not on record";

  const mlaSubtext = mlaName
    ? mlaParty ?? (hi ? "दल दर्ज नहीं है" : "Party unavailable")
    : hi
    ? "इस विधानसभा क्षेत्र के विधायक अभी दर्ज नहीं हैं"
    : "No MLA on record for this constituency";

  const reservedLbl = reservedLabel(reservedStatus, hi);
  const surveyStatus = hasSurvey ? (hi ? "सक्रिय" : "Active") : (hi ? "निष्क्रिय" : "Inactive");

  const participationRate =
    responseCount > 0 ? `${Math.min(100, Math.round((responseCount / 100000) * 100))}%` : "0%";

  return (
    <div className="min-h-screen bg-[#f8fafc]/50 text-slate-800">

      {/* ═══════════════ 1. HERO SECTION ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f3f7fd] via-[#f7f9fe] to-white pt-2.5 sm:pt-4 pb-6 sm:pb-10 border-b border-slate-100/80">
        {/* Soft pastel aura background blobs (CSS only) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Subtle dotted pattern on right */}
          <div
            className="absolute right-0 top-0 h-80 w-[480px] opacity-[0.25]"
            style={{
              backgroundImage: "radial-gradient(circle, #94a3b8 1.2px, transparent 1.2px)",
              backgroundSize: "16px 16px",
            }}
          />
          {/* Peach/coral glow center-top */}
          <div className="absolute left-[45%] -top-20 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
          {/* Soft lavender/violet glow top-right */}
          <div className="absolute -right-16 top-6 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
          {/* Mint/cyan glow mid-right */}
          <div className="absolute right-1/4 top-36 h-48 w-48 rounded-full bg-teal-100/40 blur-2xl" />
          {/* Subtle amber glow left */}
          <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-amber-100/35 blur-3xl" />
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-2 sm:mb-3">
            <Breadcrumb
              items={[
                { label: hi ? "राज्य" : "States", href: "/rajya" },
                { label: stateName, href: stateHref },
                { label: hi ? "जिले" : "Districts", href: `${stateHref}#district-explorer` },
                { label: districtName, href: districtHref },
                { label: constituencyName },
              ]}
            />
          </div>

          {/* Hero Grid: Left content ~51% | Right Stats card ~49% */}
          <div className="grid grid-cols-1 items-center gap-5 sm:gap-8 lg:grid-cols-[51fr_49fr]">

            {/* ── LEFT: Headline + Details + CTA Buttons ── */}
            <div>
              {/* Eyebrow */}
              <p className="text-sm sm:text-[15px] font-bold text-[#f9591f] tracking-wide">
                {stateName} · {districtName} · {hi ? "विधानसभा क्षेत्र" : "Constituency"} #{constituencyNumber}
              </p>

              {/* Large Constituency Headline */}
              <h1 className="mt-1 font-display text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-slate-900 leading-[1.08] tracking-tight">
                {constituencyName}
              </h1>

              {/* Blue Subtitle */}
              <p className="mt-1.5 sm:mt-2 text-lg sm:text-2xl font-bold text-[#2563eb]">
                {hi ? "विधानसभा चुनाव सर्वेक्षण 2027" : "Assembly Election Survey 2027"}
              </p>

              {/* Description Copy */}
              <p className="mt-2.5 sm:mt-3 max-w-lg text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {hi
                  ? `${constituencyName} विधानसभा क्षेत्र से जुड़े मुद्दों, जनता की राय और क्षेत्र के विकास से संबंधित जानकारी प्राप्त करें और अपना मत देकर इस सर्वेक्षण में भाग लें।`
                  : `Explore the issues, public opinion, and development priorities of ${constituencyName} constituency — and participate in the 2027 election survey.`}
              </p>

              {/* CTA Action Buttons */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={surveyHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#f9591f] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white shadow-sm hover:bg-[#ea4e17] active:scale-[0.98] transition-all"
                >
                  <Users size={17} />
                  <span>{hi ? "सर्वे में भाग लें" : "Take the Survey"}</span>
                  <ArrowRight size={15} className="ml-0.5" />
                </Link>
                <Link
                  href={resultsHref}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <BarChart2 size={17} className="text-slate-600" />
                  <span>{hi ? "परिणाम देखें" : "View Results"}</span>
                </Link>
              </div>
            </div>

            {/* ── RIGHT: SINGLE Horizontal Statistics Card ── */}
            <div className="rounded-2xl border border-slate-100 bg-white/95 p-3.5 sm:p-6 shadow-sm backdrop-blur-xs">
              <div className="grid grid-cols-3 divide-x divide-slate-100">
                {/* Stat 1: Total Responses */}
                <div className="flex flex-col items-center text-center px-1.5 sm:px-3">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600 mb-2">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-none">
                    {formatNumber(responseCount)}
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm lg:text-[15px] font-bold text-slate-800">
                    {hi ? "कुल प्रतिक्रियाएं" : "Total Responses"}
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] text-slate-500 font-normal leading-tight">
                    {hi ? "अब तक प्राप्त सर्वे" : "Responses so far"}
                  </p>
                </div>

                {/* Stat 2: Reservation Status */}
                <div className="flex flex-col items-center text-center px-1.5 sm:px-3">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-orange-50 text-[#f97316] mb-2">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-none truncate max-w-full">
                    {reservedLbl}
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm lg:text-[15px] font-bold text-slate-800">
                    {hi ? "आरक्षण स्थिति" : "Reservation"}
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] text-slate-500 font-normal leading-tight">
                    {reservedStatus === "None"
                      ? hi
                        ? "सामान्य वर्ग"
                        : "General seat"
                      : hi
                      ? `${reservedStatus} आरक्षित`
                      : `${reservedStatus} Reserved`}
                  </p>
                </div>

                {/* Stat 3: Current MLA */}
                <div className="flex flex-col items-center text-center px-1.5 sm:px-3">
                  <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                    <UserCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <p className="text-base sm:text-2xl font-extrabold text-slate-900 leading-tight truncate max-w-full">
                    {mlaDisplay}
                  </p>
                  <p className="mt-1.5 text-xs sm:text-sm lg:text-[15px] font-bold text-slate-800">
                    {hi ? "वर्तमान विधायक" : "Current MLA"}
                  </p>
                  <p className="mt-1 text-xs sm:text-[13px] text-slate-500 font-normal leading-tight truncate max-w-full">
                    {mlaSubtext}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════ 2. TWO-COLUMN MAIN SECTION ═══════════════ */}
      <section className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 py-5 sm:py-7">
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">

          {/* ── LEFT CARD: सर्वे में भाग लें ── */}
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
            {/* Heading with blue bar */}
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#2563eb]" />
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">
                {hi ? "सर्वे में भाग लें" : "Participate in Survey"}
              </h2>
            </div>
            <p className="mt-2 text-sm sm:text-[15px] text-slate-600 leading-relaxed">
              {hi
                ? "अपने विधानसभा क्षेत्र की समस्याओं, विकास और मुद्दों पर अपनी राय साझा करें। आपका मत बेहतर और मजबूत लोकतंत्र के लिए महत्वपूर्ण है।"
                : "Share your opinion on the issues and priorities of your constituency. Your vote is important for a stronger democracy."}
            </p>

            {/* Checklist Container with soft illustration */}
            <div className="mt-4 sm:mt-5 rounded-xl bg-[#f8fafc] border border-slate-100 p-3.5 sm:p-5 flex items-center gap-3 sm:gap-6">
              {/* CSS Clipboard Illustration */}
              <div className="hidden sm:block">
                <SurveyClipboardGraphic />
              </div>

              {/* 3 Green Checklist Points */}
              <ul className="space-y-2.5 sm:space-y-3 text-sm sm:text-[15px] text-slate-700 font-medium leading-snug">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{hi ? "अपने क्षेत्र के प्रमुख मुद्दों पर राय दें" : "Share opinions on key local issues"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{hi ? "अपने इलाके के विकास की प्राथमिकताएं बताएं" : "State development priorities for your area"}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>
                    {hi
                      ? "यह सर्वेक्षण पूरी तरह से स्वतंत्र और गैर-राजनीतिक है"
                      : "This survey is completely independent and non-partisan"}
                  </span>
                </li>
              </ul>
            </div>

            {/* Full-width Orange CTA */}
            <div className="mt-4 sm:mt-5 pt-0.5">
              <Link
                href={surveyHref}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f9591f] py-3 text-sm sm:text-base font-bold text-white shadow-2xs hover:bg-[#ea4e17] active:scale-[0.99] transition-all"
              >
                <span>{hi ? "सर्वे में भाग लें" : "Take the Survey"}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* ── RIGHT CARD: विधानसभा क्षेत्र की जानकारी ── */}
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
            {/* Heading with blue bar */}
            <div className="flex items-center gap-2 mb-3.5 sm:mb-4">
              <span className="h-5 w-1 rounded-full bg-[#2563eb]" />
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">
                {hi ? "विधानसभा क्षेत्र की जानकारी" : "Constituency Information"}
              </h2>
            </div>

            {/* 2 columns × 3 rows of rounded info boxes */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 flex-1">
              {/* Item 1: AC Number */}
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-[#f8fafc] border border-slate-100/90 p-2.5 sm:p-3.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                  <Landmark className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500 truncate">
                    {hi ? "विधानसभा क्षेत्र संख्या" : "AC Number"}
                  </p>
                  <p className="text-sm sm:text-base lg:text-[17px] font-extrabold text-slate-900 mt-0.5 truncate">
                    AC #{constituencyNumber}
                  </p>
                </div>
              </div>

              {/* Item 2: District */}
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-[#f8fafc] border border-slate-100/90 p-2.5 sm:p-3.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500 truncate">{hi ? "जिला" : "District"}</p>
                  <p className="text-sm sm:text-base lg:text-[17px] font-extrabold text-slate-900 mt-0.5 truncate">{districtName}</p>
                </div>
              </div>

              {/* Item 3: Reservation */}
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-[#f8fafc] border border-slate-100/90 p-2.5 sm:p-3.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#f97316]">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500 truncate">
                    {hi ? "आरक्षण स्थिति" : "Reservation Status"}
                  </p>
                  <p className="text-sm sm:text-base lg:text-[17px] font-extrabold text-slate-900 mt-0.5 truncate">{reservedLbl}</p>
                  <p className="text-xs sm:text-[13px] text-slate-500 truncate">
                    {reservedStatus === "None"
                      ? hi
                        ? "सामान्य वर्ग"
                        : "General category"
                      : hi
                      ? `${reservedStatus} वर्ग हेतु`
                      : `For ${reservedStatus}`}
                  </p>
                </div>
              </div>

              {/* Item 4: Total Responses */}
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-[#f8fafc] border border-slate-100/90 p-2.5 sm:p-3.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500 truncate">
                    {hi ? "कुल प्रतिक्रियाएं" : "Total Responses"}
                  </p>
                  <p className="text-sm sm:text-base lg:text-[17px] font-extrabold text-slate-900 mt-0.5 truncate">
                    {formatNumber(responseCount)}
                  </p>
                  <p className="text-xs sm:text-[13px] text-slate-500 truncate">
                    {hi ? "अब तक प्राप्त सर्वे" : "Survey responses"}
                  </p>
                </div>
              </div>

              {/* Item 5: Current MLA */}
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-[#f8fafc] border border-slate-100/90 p-2.5 sm:p-3.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-500">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500 truncate">
                    {hi ? "वर्तमान विधायक" : "Current MLA"}
                  </p>
                  <p className="text-sm sm:text-base lg:text-[17px] font-extrabold text-slate-900 mt-0.5 truncate">
                    {mlaDisplay}
                  </p>
                  <p className="text-xs sm:text-[13px] text-slate-500 truncate">
                    {mlaSubtext}
                  </p>
                </div>
              </div>

              {/* Item 6: Survey Status */}
              <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl bg-[#f8fafc] border border-slate-100/90 p-2.5 sm:p-3.5">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-[13px] font-medium text-slate-500 truncate">
                    {hi ? "सर्वेक्षण स्थिति" : "Survey Status"}
                  </p>
                  <p
                    className={`text-sm sm:text-base lg:text-[17px] font-extrabold mt-0.5 truncate ${
                      hasSurvey ? "text-emerald-600" : "text-slate-600"
                    }`}
                  >
                    {surveyStatus}
                  </p>
                  <p className="text-xs sm:text-[13px] text-slate-500 truncate">
                    {hasSurvey
                      ? hi
                        ? "मत देना जारी है"
                        : "You can cast vote"
                      : hi
                      ? "सर्वे अभी बंद है"
                      : "Currently closed"}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════ 3. SURVEY STATUS 2x2 GRID ON MOBILE ═══════════════ */}
      <section className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 pb-4 sm:pb-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-sm">
          {/* Heading with blue bar */}
          <div className="flex items-center gap-2 mb-3.5 sm:mb-4">
            <span className="h-5 w-1 rounded-full bg-[#2563eb]" />
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">
              {constituencyName} {hi ? "की सर्वेक्षण स्थिति" : "Survey Status"}
            </h2>
          </div>

          {/* 4 Equal Metric Cards: 2 × 2 Grid on Mobile, 4-col on Desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {/* Metric 1: Total Responses */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 rounded-xl bg-[#f5f8ff] border border-blue-50/80 p-3 sm:p-4">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-none">
                  {formatNumber(responseCount)}
                </p>
                <p className="text-xs sm:text-sm lg:text-[15px] font-bold text-slate-800 mt-1.5 truncate">
                  {hi ? "कुल प्रतिक्रियाएं" : "Total Responses"}
                </p>
                <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5">
                  {hi ? "जनता की भागीदारी" : "Public participation"}
                </p>
              </div>
            </div>

            {/* Metric 2: Today Responses */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 rounded-xl bg-[#fffaf5] border border-orange-50/80 p-3 sm:p-4">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[#f59e0b]">
                <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-none">
                  {formatNumber(todayResponseCount)}
                </p>
                <p className="text-xs sm:text-sm lg:text-[15px] font-bold text-slate-800 mt-1.5 truncate">
                  {hi ? "आज की प्रतिक्रियाएं" : "Today's Responses"}
                </p>
                <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5">
                  {hi ? "आज प्राप्त प्रतिक्रियाएं" : "Responses today"}
                </p>
              </div>
            </div>

            {/* Metric 3: Survey Status */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 rounded-xl bg-[#f4fcf7] border border-emerald-50/80 p-3 sm:p-4">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-base sm:text-xl lg:text-2xl font-extrabold leading-none truncate ${
                    hasSurvey ? "text-emerald-600" : "text-slate-600"
                  }`}
                >
                  {surveyStatus}
                </p>
                <p className="text-xs sm:text-sm lg:text-[15px] font-bold text-slate-800 mt-1.5 truncate">
                  {hi ? "सर्वेक्षण स्थिति" : "Survey Status"}
                </p>
                <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5">
                  {hasSurvey ? (hi ? "मत देना जारी है" : "Voting is open") : hi ? "बंद है" : "Closed"}
                </p>
              </div>
            </div>

            {/* Metric 4: Participation Rate */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 rounded-xl bg-[#faf5ff] border border-purple-50/80 p-3 sm:p-4">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#2563eb]">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-none">
                  {participationRate}
                </p>
                <p className="text-xs sm:text-sm lg:text-[15px] font-bold text-slate-800 mt-1.5 truncate">
                  {hi ? "भागीदारी दर" : "Participation Rate"}
                </p>
                <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5">
                  {hi ? "कुल मतदाता अनुपात" : "Of total electorate"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. FOUR-COLUMN INFORMATION STRIP ═══════════════ */}
      <section className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Card 1: सर्वेक्षण के बारे में */}
          <div className="flex items-center justify-between rounded-xl bg-[#f0f6ff]/70 border border-blue-100 p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#2563eb] mt-0.5">
                <Info size={18} />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-900">{hi ? "सर्वेक्षण के बारे में" : "About Survey"}</p>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-normal mt-0.5">
                  {hi ? "यह डेटा हमारे उपयोगकर्ताओं द्वारा भेजी गई प्रतिक्रियाओं पर आधारित है।" : "Based on verified voluntary public survey responses."}
                </p>
              </div>
            </div>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-blue-500 ml-2">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Card 2: जनता की राय */}
          <div className="flex items-center justify-between rounded-xl bg-[#f0fdf4]/70 border border-emerald-100 p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-900">{hi ? "जनता की राय" : "Public Opinion"}</p>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-normal mt-0.5">
                  {hi ? "अपने क्षेत्र की आवाज़ जानें और तुलना करें।" : "Discover and compare the authentic public voice of this area."}
                </p>
              </div>
            </div>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-emerald-500 ml-2">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Card 3: पारदर्शी और निष्पक्ष */}
          <div className="flex items-center justify-between rounded-xl bg-[#fffbeb]/70 border border-amber-100 p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 mt-0.5">
                <BarChart2 size={18} />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-900">{hi ? "पारदर्शी और निष्पक्ष" : "Transparent & Fair"}</p>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-normal mt-0.5">
                  {hi ? "यह एक स्वतंत्र और गैर-राजनीतिक सर्वेक्षण मंच है।" : "An independent, non-partisan, fact-checked survey platform."}
                </p>
              </div>
            </div>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-amber-500 ml-2">
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Card 4: आप भी भाग लें */}
          <div className="flex items-center justify-between rounded-xl bg-[#faf5ff]/70 border border-purple-100 p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 mt-0.5">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-slate-900">{hi ? "आप भी भाग लें" : "Participate Now"}</p>
                <p className="text-xs sm:text-[13px] text-slate-600 leading-normal mt-0.5">
                  {hi ? "अपने विधानसभा क्षेत्र के सर्वेक्षण में हिस्सा लें और बदलाव का हिस्सा बनें।" : "Take the survey for your constituency and contribute your opinion."}
                </p>
              </div>
            </div>
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-purple-500 ml-2">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
