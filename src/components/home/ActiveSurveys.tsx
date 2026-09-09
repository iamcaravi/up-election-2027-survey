"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight, MapPin, Landmark, Building2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { constituencyPath, districtsPath, electionPath } from "@/lib/routes";
import { displayStateName, formatNumber } from "@/lib/utils";
import { SectionHeading } from "@/components/home/SectionHeading";

export interface ActiveSurveyItem {
  id: string;
  title: string;
  stateName: string;
  stateSlug: string;
  electionSlug: string;
  electionName: string;
  districtName: string | null;
  constituencyName: string | null;
  constituencySlug: string | null;
  responseCount: number;
}

export interface SurveyGatewayState {
  slug: string;
  name: string;
  constituencyCount: number;
  election: { slug: string } | null;
}

export function ActiveSurveys({
  items,
  primaryState,
}: {
  items: ActiveSurveyItem[];
  primaryState: SurveyGatewayState | null;
}) {
  const { t, locale } = useLocale();

  return (
    <>
      <SectionHeading eyebrow="Public Mood" title={t.home.surveys.title} subtitle={t.home.surveys.subtitle} />

      {primaryState && (
        <div className="card-surface mb-6 rounded-2xl p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink">
                <MapPin size={20} />
              </span>
              <div>
                <p className="font-display text-lg font-bold">{displayStateName(primaryState.name, primaryState.slug, locale)}</p>
                <p className="text-sm text-muted">
                  {formatNumber(primaryState.constituencyCount)} {t.home.surveys.gatewayConstituencyLabel}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium text-muted sm:text-right">{t.home.surveys.chooseLabel}</p>
          </div>
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
            <Link
              href={primaryState.election ? districtsPath(primaryState.slug, primaryState.election.slug) : `/${primaryState.slug}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
            >
              <Landmark size={14} /> {t.home.surveys.chooseDistrictCta}
            </Link>
            <Link
              href={
                primaryState.election
                  ? `${electionPath(primaryState.slug, primaryState.election.slug)}/constituencies`
                  : `/${primaryState.slug}`
              }
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
            >
              <Building2 size={14} /> {t.home.surveys.chooseConstituencyCta}
            </Link>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center">
          <BarChart3 className="mx-auto mb-3 text-muted" size={26} />
          <p className="font-semibold">{t.home.surveys.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">{t.home.surveys.emptyBody}</p>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{t.home.surveys.featuredTitle}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s, i) => {
              const href = s.constituencySlug
                ? `${constituencyPath(s.stateSlug, s.electionSlug, s.constituencySlug)}/survey`
                : undefined;

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="card-surface flex flex-col rounded-2xl p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    {s.districtName ?? s.stateName}
                  </p>
                  <p className="mt-2 font-display text-base font-bold leading-snug">{s.title}</p>
                  <p className="mt-1 text-sm text-muted">{s.constituencyName ?? "Statewide"}</p>
                  <p className="mt-3 text-sm font-medium">
                    {formatNumber(s.responseCount)} {t.home.surveys.responsesLabel}
                  </p>
                  {href && (
                    <Link
                      href={href}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:underline underline-offset-4"
                    >
                      {t.home.surveys.participate} <ArrowRight size={14} />
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
