"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Crown,
  BarChart3,
  TrendingUp,
  Users,
  Lightbulb,
  MapPinned,
  SlidersHorizontal,
  FileDown,
  GraduationCap,
  Check,
  ShieldCheck,
  Lock,
  Headset,
  ChevronDown,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

interface PremiumAnalyticsLandingProps {
  stateName: string;
  stateHref: string;
  electionLabel: string;
  ctaHref: string;
}

const FEATURE_ICONS = [
  BarChart3,
  TrendingUp,
  Users,
  Lightbulb,
  MapPinned,
  SlidersHorizontal,
  FileDown,
  GraduationCap,
] as const;

const PARTY_PREVIEW = [
  { label: "BJP", pct: 34, color: "#ea580c" },
  { label: "INC", pct: 28, color: "#2563eb" },
  { label: "SP", pct: 18, color: "#7c3aed" },
  { label: "BSP", pct: 8, color: "#0f172a" },
  { label: "अन्य", pct: 4, color: "#16a34a" },
];

const AGE_PREVIEW = [
  { label: "18–25", pct: 12 },
  { label: "26–35", pct: 28 },
  { label: "36–45", pct: 24 },
  { label: "46–60", pct: 20 },
  { label: "60+", pct: 16 },
];

const TREND_PREVIEW = [
  { label: "2017", pct: 30 },
  { label: "2022", pct: 33 },
  { label: "2026*", pct: 34 },
];

export function PremiumAnalyticsLanding({ stateName, stateHref, electionLabel, ctaHref }: PremiumAnalyticsLandingProps) {
  const { t } = useLocale();
  const p = t.premium;

  const features = [
    p.features.detailedData,
    p.features.comparison,
    p.features.voterProfile,
    p.features.keyFindings,
    p.features.interactiveAnalysis,
    p.features.customFilters,
    p.features.downloadReports,
    p.features.expertUseful,
  ];

  const tabs = [
    { key: "detailedResults", label: p.previewSection.tabs.detailedResults },
    { key: "voterProfile", label: p.previewSection.tabs.voterProfile },
    { key: "comparison", label: p.previewSection.tabs.comparison },
    { key: "interactiveAnalysis", label: p.previewSection.tabs.interactiveAnalysis },
    { key: "downloadReport", label: p.previewSection.tabs.downloadReport },
  ] as const;
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("detailedResults");

  const trustStrip = [
    { icon: ShieldCheck, title: p.trustStrip.secureData, subtitle: p.trustStrip.secureDataSub },
    { icon: Lock, title: p.trustStrip.noPersonalInfo, subtitle: p.trustStrip.noPersonalInfoSub },
    { icon: Users, title: p.trustStrip.trustedByThousands, subtitle: p.trustStrip.trustedByThousandsSub },
    { icon: Headset, title: p.trustStrip.support, subtitle: p.trustStrip.supportSub },
  ];

  return (
    <div className="bg-[#f4f8fd]">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-white">
        <Container className="flex items-center gap-1.5 py-3 text-xs font-medium text-muted sm:text-sm">
          <Link href={stateHref} className="hover:text-ink">
            {stateName}
          </Link>
          <ChevronRight size={13} className="shrink-0 text-border" />
          <span className="truncate text-muted">{electionLabel}</span>
          <ChevronRight size={13} className="shrink-0 text-border" />
          <span className="truncate font-semibold text-ink">{p.breadcrumb}</span>
        </Container>
      </div>

      {/* Hero */}
      <section className="border-b border-border">
        <Container className="grid gap-8 py-10 sm:py-12 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-10 lg:py-16">
          {/* Left column */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <Crown size={13} className="fill-amber-500 text-amber-500" />
              {p.badge}
            </span>
            <h1 className="mt-4 whitespace-pre-line font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              {p.heading}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted sm:text-base">{p.subheading}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {features.map((feature, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <div key={feature.title} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/8 text-ink">
                      <Icon size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{feature.title}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: pricing card */}
          <div className="lg:sticky lg:top-20">
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_45px_-24px_rgba(15,23,42,0.35)]">
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-lg font-extrabold text-ink">{p.pricingCard.title}</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-bold text-positive">
                    <Check size={12} /> {p.pricingCard.freeTag}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-extrabold tracking-tight text-ink">{p.pricingCard.freeLabel}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted">{p.pricingCard.freeSubtext}</p>
              </div>

              <div className="px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">{p.pricingCard.featuresHeading}</p>
                <ul className="mt-3 space-y-2.5">
                  {p.pricingCard.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-positive/15 text-positive">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <LinkButton href={ctaHref} variant="cta" size="lg" className="mt-6 w-full">
                  {p.pricingCard.cta} <ArrowRight size={16} />
                </LinkButton>

                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                  <Lock size={12} />
                  {p.pricingCard.trustNote}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Preview section */}
      <section className="py-10 sm:py-14">
        <Container>
          <h2 className="text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">{p.previewSection.heading}</h2>

          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition-colors sm:text-sm",
                  activeTab === tab.key
                    ? "border-ink bg-ink text-white"
                    : "border-border bg-white text-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Party breakdown */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-bold text-muted">{p.previewSection.cards.partyBreakdown}</p>
              <div className="mt-4 flex h-32 items-end justify-between gap-2">
                {PARTY_PREVIEW.map((party, i) => (
                  <div key={party.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-ink">{party.pct}%</span>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(party.pct / 34) * 80}px` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full rounded-t-md"
                      style={{ background: party.color }}
                    />
                    <span className="text-[10px] font-semibold text-muted">{party.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Age profile */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-bold text-muted">{p.previewSection.cards.ageProfile}</p>
              <div className="mt-4 flex h-32 items-end justify-between gap-2">
                {AGE_PREVIEW.map((bucket, i) => (
                  <div key={bucket.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-ink">{bucket.pct}%</span>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(bucket.pct / 28) * 80}px` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full rounded-t-md bg-sky-500"
                    />
                    <span className="text-[10px] font-semibold text-muted">{bucket.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend comparison */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-bold text-muted">{p.previewSection.cards.trendComparison}</p>
              <div className="mt-4 flex h-32 items-end justify-between gap-3 px-2">
                {TREND_PREVIEW.map((point, i) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-ink">{point.pct}%</span>
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(point.pct / 34) * 80}px` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="w-full rounded-t-md bg-ink"
                    />
                    <span className="text-[10px] font-semibold text-muted">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Download report */}
            <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
              <p className="text-xs font-bold text-muted">{p.previewSection.cards.downloadReport}</p>
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <FileText size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{p.previewSection.cards.pdfReport}</p>
                    <p className="truncate text-[11px] text-muted">{p.previewSection.cards.pdfReportDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                    <FileSpreadsheet size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{p.previewSection.cards.excelFile}</p>
                    <p className="truncate text-[11px] text-muted">{p.previewSection.cards.excelFileDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border bg-white py-8">
        <Container className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map(({ icon: Icon, title, subtitle }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/8 text-ink">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{title}</p>
                <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-10 sm:py-14">
        <Container className="max-w-3xl">
          <h2 className="text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">{p.faqHeading}</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-white">
            {p.faq.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-10 sm:py-14">
        <Container>
          <div className="rounded-3xl bg-ink px-6 py-12 text-center sm:px-12 sm:py-16">
            <h2 className="whitespace-pre-line font-display text-2xl font-extrabold text-white sm:text-3xl">{p.finalCta.heading}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">{p.finalCta.body}</p>
            <LinkButton href={ctaHref} variant="cta" size="lg" className="mt-7 inline-flex">
              {p.finalCta.cta} <ArrowRight size={16} />
            </LinkButton>
          </div>
        </Container>
      </section>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-ink sm:text-base">{question}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="px-5 pb-4 text-sm leading-6 text-muted">{answer}</p>}
    </div>
  );
}
