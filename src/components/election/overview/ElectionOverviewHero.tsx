import { CalendarDays, MapPin, Landmark, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVY, countLabel, statusLabel, type ElectionOverviewData } from "./shared";

type HeroProps = Pick<
  ElectionOverviewData,
  "hi" | "stateName" | "electionYear" | "electionStatus" | "districtCount" | "constituencyCount"
>;

export function ElectionOverviewHero(props: HeroProps) {
  const { hi, stateName, electionYear } = props;
  return (
    <section className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)] lg:gap-8">
      <div className="min-w-0">
        <p className="text-lg font-bold text-orange-600 sm:text-xl">{stateName}</p>
        <h1 className={cn("mt-1 font-display text-[34px] font-extrabold leading-[1.15] tracking-tight sm:text-[44px] lg:text-[50px]", NAVY)}>
          {hi ? `विधानसभा चुनाव ${electionYear}` : `Assembly Election ${electionYear}`}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-700 sm:text-[17px]">
          {hi
            ? `${stateName} विधानसभा चुनाव ${electionYear} से जुड़ी जानकारी, क्षेत्रवार सर्वेक्षण और चुनाव संबंधित डेटा देखें।`
            : `Explore information, constituency-wise surveys and election data for the ${stateName} Assembly Election ${electionYear}.`}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
          {hi
            ? "इस पेज पर आप चुनाव का अवलोकन, जिलों और विधानसभा क्षेत्रों की जानकारी तथा सर्वेक्षण से जुड़े महत्वपूर्ण डेटा देख सकते हैं।"
            : "This page gives an overview of the election, its districts and assembly constituencies, and key survey data."}
        </p>
      </div>

      <ElectionStatusCard {...props} />
    </section>
  );
}

function ElectionStatusCard({ hi, stateName, electionYear, electionStatus, districtCount, constituencyCount }: HeroProps) {
  return (
    <aside
      aria-label={hi ? "चुनाव की स्थिति" : "Election status"}
      className="flex items-center gap-4 rounded-2xl border border-orange-200/90 bg-[linear-gradient(135deg,#fff8f1_0%,#ffffff_55%,#fff3e8_100%)] p-4 shadow-[0_6px_18px_-12px_rgba(234,88,12,0.35)] sm:gap-5 sm:p-5"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_-3px_rgba(15,31,75,0.15)] ring-1 ring-orange-100 sm:h-[84px] sm:w-[84px]">
        <CalendarDays className="h-8 w-8 text-orange-500 sm:h-10 sm:w-10" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-display text-xl font-extrabold sm:text-2xl", NAVY)}>
          {hi ? `${electionYear} चुनाव` : `${electionYear} Election`}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-100" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          </span>
          {statusLabel(electionStatus, hi)}
        </p>
        <div className="mt-3 border-t border-orange-100 pt-3 text-[13px] text-slate-700">
          <p className="flex items-center gap-2">
            <MapPin size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
            {stateName}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="flex items-center gap-2">
              <Landmark size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
              {countLabel(constituencyCount, hi, "विधानसभा क्षेत्र", "Assembly Constituencies")}
            </span>
            <span className="flex items-center gap-2">
              <Users size={15} className="shrink-0 text-slate-500" aria-hidden="true" />
              {countLabel(districtCount, hi, "जिले", "Districts")}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
