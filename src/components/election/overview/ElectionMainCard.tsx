import Link from "next/link";
import { ArrowRight, CalendarDays, Landmark, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FOCUS,
  NAVY,
  countLabel,
  formatElectionDate,
  statusLabel,
  type ElectionOverviewData,
} from "./shared";

type MainCardProps = Pick<
  ElectionOverviewData,
  "hi" | "stateName" | "electionYear" | "electionStatus" | "electionDate" | "districtCount" | "constituencyCount"
> & { ctaHref: string };

function Divider() {
  return <span aria-hidden="true" className="hidden h-6 w-px bg-slate-200 sm:block" />;
}

export function ElectionMainCard({
  hi,
  stateName,
  electionYear,
  electionStatus,
  electionDate,
  districtCount,
  constituencyCount,
  ctaHref,
}: MainCardProps) {
  const title = hi ? `${stateName} विधानसभा चुनाव ${electionYear}` : `${stateName} Assembly Election ${electionYear}`;

  return (
    <section
      aria-labelledby="election-main-title"
      className="flex flex-col gap-4 rounded-2xl border border-orange-200/90 bg-[linear-gradient(100deg,#fffaf5_0%,#ffffff_45%,#fff7f0_100%)] p-4 shadow-[0_6px_18px_-12px_rgba(234,88,12,0.3)] sm:p-6 lg:flex-row lg:items-center lg:gap-7 lg:px-7"
    >
      <span className="hidden h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100 sm:flex">
        <CalendarDays className="h-12 w-12 text-orange-500" strokeWidth={1.5} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <span className="inline-flex items-center rounded-full bg-orange-500 px-3 py-0.5 text-xs font-semibold text-white">
          {statusLabel(electionStatus, hi)}
        </span>
        <h2 id="election-main-title" className={cn("mt-2 font-display text-xl font-extrabold leading-snug sm:text-2xl lg:text-[28px]", NAVY)}>
          {title}
        </h2>

        <div className="mt-3 flex flex-col gap-2.5 text-sm text-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
          <span className="flex items-center gap-2">
            <Landmark size={18} className="shrink-0 text-orange-500" strokeWidth={1.75} aria-hidden="true" />
            {countLabel(constituencyCount, hi, "विधानसभा क्षेत्र", "Assembly Constituencies")}
          </span>
          <Divider />
          <span className="flex items-center gap-2">
            <MapPin size={18} className="shrink-0 text-orange-500" strokeWidth={1.75} aria-hidden="true" />
            {countLabel(districtCount, hi, "जिले", "Districts")}
          </span>
          <Divider />
          <span className="flex items-start gap-2">
            <CalendarDays size={18} className="mt-0.5 shrink-0 text-orange-500" strokeWidth={1.75} aria-hidden="true" />
            <span className="leading-snug">
              <span className={cn("block font-semibold", NAVY)}>
                {electionDate ? (hi ? "मतदान तिथि" : "Polling date") : hi ? "चुनाव कार्यक्रम" : "Election schedule"}
              </span>
              <span className="block text-slate-500">
                {electionDate
                  ? formatElectionDate(electionDate, hi)
                  : hi
                    ? "आधिकारिक घोषणा प्रतीक्षित"
                    : "Official announcement awaited"}
              </span>
            </span>
          </span>
        </div>
      </div>

      <Link
        href={ctaHref}
        className={cn(
          "inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f1f4b] px-7 text-[15px] font-semibold text-white shadow-[0_6px_16px_-8px_rgba(15,31,75,0.6)] transition-colors hover:bg-[#1a2d63] lg:w-auto",
          FOCUS
        )}
      >
        {hi ? "जिले देखें" : "View Districts"}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}
