import Link from "next/link";
import { ArrowRight, Map as MapIcon, UsersRound, type LucideIcon } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { FOCUS, NAVY, hasValue, type ElectionOverviewData } from "./shared";

type ExploreProps = Pick<ElectionOverviewData, "hi" | "stateName" | "electionYear" | "constituencyCount"> & {
  links: Pick<ElectionOverviewData["links"], "constituencies" | "survey">;
};

interface ExploreItem {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** border / background tint / icon circle / arrow circle */
  tone: { border: string; bg: string; icon: string; arrow: string };
}

export function ElectionExploreCards({ hi, stateName, electionYear, constituencyCount, links }: ExploreProps) {
  const seats = hasValue(constituencyCount) ? `${formatNumber(constituencyCount)} ` : "";
  const items: ExploreItem[] = [
    {
      href: links.constituencies,
      title: hi ? "विधानसभा क्षेत्र देखें" : "View Constituencies",
      description: hi
        ? `${seats}विधानसभा क्षेत्रों की जानकारी, क्षेत्रवार सर्वेक्षण और प्रमुख मुद्दे देखें।`
        : `Information on ${seats}assembly constituencies, constituency-wise surveys and key issues.`,
      icon: MapIcon,
      tone: { border: "border-blue-100 hover:border-blue-300", bg: "from-white to-blue-50/40", icon: "bg-blue-50 text-blue-600", arrow: "bg-blue-50 text-blue-600" },
    },
    // Districts are reached through the main election card's CTA, so they
    // intentionally have no card here — every destination appears once.
    {
      href: links.survey,
      title: hi ? "सर्वेक्षण में भाग लें" : "Take the Survey",
      description: hi
        ? "अपने क्षेत्र से जुड़ा सर्वेक्षण देखें और अपनी राय साझा करें।"
        : "Find the survey for your constituency and share your opinion.",
      icon: UsersRound,
      tone: { border: "border-violet-100 hover:border-violet-300", bg: "from-white to-violet-50/40", icon: "bg-violet-50 text-violet-600", arrow: "bg-violet-50 text-violet-600" },
    },
  ];

  return (
    <section aria-labelledby="election-explore-title">
      <h2 id="election-explore-title" className={cn("font-display text-2xl font-extrabold tracking-tight sm:text-[28px]", NAVY)}>
        {hi ? "चुनाव को समझें" : "Understand the Election"}
      </h2>
      <p className="mt-1 text-sm text-slate-500 sm:text-[15px]">
        {hi
          ? `${stateName} विधानसभा चुनाव ${electionYear} से जुड़ी प्रमुख जानकारियों तक आसानी से पहुँचें।`
          : `Quick access to key information about the ${stateName} Assembly Election ${electionYear}.`}
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        {items.map(({ href, title, description, icon: Icon, tone }) => (
          <Link
            key={title}
            href={href}
            className={cn(
              "group flex items-center gap-4 rounded-2xl border bg-gradient-to-br p-4 shadow-[0_1px_2px_rgba(15,31,75,0.04),0_6px_16px_-10px_rgba(15,31,75,0.12)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(15,31,75,0.25)] sm:p-5",
              tone.border,
              tone.bg,
              FOCUS
            )}
          >
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14", tone.icon)}>
              <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block font-display text-base font-bold sm:text-lg", NAVY)}>{title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-slate-500 sm:text-sm">{description}</span>
            </span>
            <span
              aria-hidden="true"
              className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5", tone.arrow)}
            >
              <ArrowRight size={18} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
