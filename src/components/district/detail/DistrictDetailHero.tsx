import { ChartNoAxesColumnIncreasing, Landmark, Users, type LucideIcon } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

const NAVY = "text-[#0b1f3a]";

interface DistrictDetailHeroProps {
  hi: boolean;
  stateName: string;
  districtName: string;
  electionYear: number;
  constituencyCount: number;
  responseCount: number;
  activeSurveyCount: number;
}

interface HeroStat {
  icon: LucideIcon;
  tone: string;
  value: number;
  label: string;
  sub: string;
}

export function DistrictDetailHero({
  hi,
  stateName,
  districtName,
  electionYear,
  constituencyCount,
  responseCount,
  activeSurveyCount,
}: DistrictDetailHeroProps) {
  const stats: HeroStat[] = [
    {
      icon: Landmark,
      tone: "bg-violet-100/80 text-violet-600",
      value: constituencyCount,
      label: hi ? "विधानसभा क्षेत्र" : "Constituencies",
      sub: hi ? "जिले में कुल विधानसभा क्षेत्र" : "Total constituencies in district",
    },
    {
      icon: Users,
      tone: "bg-orange-100/80 text-orange-500",
      value: responseCount,
      label: hi ? "कुल प्रतिक्रियाएं" : "Total Responses",
      sub: hi ? "अब तक प्राप्त सर्वे प्रतिक्रियाएं" : "Survey responses received so far",
    },
    {
      icon: ChartNoAxesColumnIncreasing,
      tone: "bg-emerald-100/80 text-emerald-600",
      value: activeSurveyCount,
      label: hi ? "सक्रिय सर्वे" : "Active Surveys",
      sub: hi ? "सर्वे जारी विधानसभा क्षेत्र" : "Constituencies with an open survey",
    },
  ];

  return (
    <section className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,700px)] lg:gap-8">
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-orange-500 sm:text-[22px]">
          {stateName} · {hi ? "जिला" : "District"}
        </p>
        <h1 className={cn("font-display text-[44px] font-extrabold leading-[1.12] tracking-tight sm:text-[56px]", NAVY)}>
          {districtName}
        </h1>
        <p className="text-xl font-extrabold leading-tight text-[#146ef5] sm:text-[24px]">
          {hi ? `विधानसभा चुनाव सर्वेक्षण ${electionYear}` : `Assembly Election Survey ${electionYear}`}
        </p>
        <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-slate-600 sm:text-[17px]">
          {hi
            ? `${districtName} जिले के सभी विधानसभा क्षेत्रों की सूची यहां देखें। प्रत्येक विधानसभा क्षेत्र में सर्वेक्षण की जानकारी, जनमत और विश्लेषण तक पहुंचें।`
            : `See every assembly constituency in ${districtName} district, with survey information, public opinion and analysis for each.`}
        </p>
      </div>

      <div
        role="group"
        aria-label={hi ? "जिला आँकड़े" : "District statistics"}
        className="grid grid-cols-3 divide-x divide-slate-200/70 rounded-2xl border border-orange-100 bg-[linear-gradient(120deg,#ffffff_0%,#ffffff_40%,#fff7ef_100%)] px-1 py-4 shadow-[0_8px_24px_-16px_rgba(234,88,12,0.35)] sm:px-2 sm:py-5"
      >
        {stats.map(({ icon: Icon, tone, value, label, sub }) => (
          <div
            key={label}
            className="flex min-w-0 flex-col items-center gap-1.5 px-1.5 text-center sm:flex-row sm:items-center sm:gap-3.5 sm:px-4 sm:text-left"
          >
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-[60px] sm:w-[60px]", tone)}>
              <Icon className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className={cn("font-display text-2xl font-extrabold leading-none sm:text-[30px]", NAVY)}>{formatNumber(value)}</p>
              <p className={cn("mt-1 text-[13px] font-bold leading-tight sm:text-base", NAVY)}>{label}</p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500 sm:text-xs">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
