import { ChartNoAxesColumnIncreasing, Info, Landmark, Users, UsersRound, type LucideIcon } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { CARD, NAVY, hasValue, unavailable, type ElectionOverviewData } from "./shared";

type StatsProps = Pick<
  ElectionOverviewData,
  "hi" | "districtCount" | "constituencyCount" | "surveyedAreaCount" | "participantCount"
>;

interface StatItem {
  value: number | null;
  labelHi: string;
  labelEn: string;
  icon: LucideIcon;
  tone: string;
}

export function ElectionStats({ hi, districtCount, constituencyCount, surveyedAreaCount, participantCount }: StatsProps) {
  const items: StatItem[] = [
    { value: districtCount, labelHi: "जिले", labelEn: "Districts", icon: Users, tone: "bg-blue-50 text-blue-600" },
    { value: constituencyCount, labelHi: "विधानसभा क्षेत्र", labelEn: "Assembly Constituencies", icon: Landmark, tone: "bg-orange-50 text-orange-600" },
    { value: surveyedAreaCount, labelHi: "सर्वेक्षण क्षेत्र", labelEn: "Surveyed Areas", icon: ChartNoAxesColumnIncreasing, tone: "bg-emerald-50 text-emerald-600" },
    { value: participantCount, labelHi: "प्रतिभागी", labelEn: "Participants", icon: UsersRound, tone: "bg-violet-50 text-violet-600" },
  ];

  return (
    <section aria-label={hi ? "चुनाव आँकड़े" : "Election statistics"} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map(({ value, labelHi, labelEn, icon: Icon, tone }) => {
        const label = hi ? labelHi : labelEn;
        return (
          <div key={labelEn} className={cn(CARD, "flex flex-col items-start gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-5")}>
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14", tone)}>
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} aria-hidden="true" />
            </span>
            {hasValue(value) ? (
              <div className="min-w-0">
                <p className={cn("font-display text-2xl font-extrabold leading-none sm:text-[28px]", NAVY)}>{formatNumber(value)}</p>
                <p className="mt-1.5 text-sm text-slate-600">{label}</p>
              </div>
            ) : (
              <div className="min-w-0">
                <p className={cn("text-[15px] font-bold leading-tight sm:text-base", NAVY)}>{label}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-500 sm:text-sm">
                  {unavailable(hi)}
                  <Info
                    size={14}
                    className="shrink-0 text-slate-400"
                    aria-label={hi ? "सर्वेक्षण डेटा उपलब्ध होने पर यहाँ दिखाया जाएगा" : "Shown here once survey data is available"}
                  />
                </p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
