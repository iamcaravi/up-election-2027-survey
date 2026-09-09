"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Vote, Landmark, Building2, Users, BarChart3, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { statePath, electionPath, districtsPath } from "@/lib/routes";
import { displayStateName } from "@/lib/utils";
import { SectionHeading } from "@/components/home/SectionHeading";

export interface ExplorerState {
  slug: string;
  name: string;
  election: { slug: string } | null;
}

export function ElectionExplorer({ primaryState }: { primaryState: ExplorerState | null }) {
  const { t, locale } = useLocale();

  const stateLabel = primaryState ? displayStateName(primaryState.name, primaryState.slug, locale) : t.home.explorer.state;

  const nodes = [
    { icon: MapPin, label: stateLabel, href: primaryState ? statePath(primaryState.slug) : null },
    {
      icon: Vote,
      label: t.home.explorer.election,
      href: primaryState?.election ? electionPath(primaryState.slug, primaryState.election.slug) : null,
    },
    {
      icon: Landmark,
      label: t.home.explorer.district,
      href: primaryState?.election ? districtsPath(primaryState.slug, primaryState.election.slug) : null,
    },
    {
      icon: Building2,
      label: t.home.explorer.constituency,
      href: primaryState?.election ? `${electionPath(primaryState.slug, primaryState.election.slug)}/constituencies` : null,
    },
    { icon: Users, label: t.home.explorer.candidate, href: null },
    { icon: BarChart3, label: t.home.explorer.survey, href: "/#surveys" },
  ];

  return (
    <>
      <SectionHeading eyebrow="How it's organized" title={t.home.explorer.title} subtitle={t.home.explorer.subtitle} />
      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-3">
        {nodes.map((node, i) => {
          const pill = (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-ink/10 text-ink">
                <node.icon size={13} />
              </span>
              {node.label}
            </span>
          );
          return (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
              className="flex items-center gap-1.5"
            >
              {node.href ? (
                <Link href={node.href} className="transition-transform hover:-translate-y-0.5">
                  {pill}
                </Link>
              ) : (
                pill
              )}
              {i < nodes.length - 1 && <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />}
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
