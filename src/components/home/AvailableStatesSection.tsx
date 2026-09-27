"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StateMap } from "@/components/map/StateMap";
import { displayStateName } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export interface StateItem {
  id: string;
  slug: string;
  name: string;
  elections: Array<{ slug: string; name: string; status: string; year: number }>;
  _count: { districts: number; constituencies: number };
}

// Fixed order and pastel styling for the 7 active states matching reference image 1
const STATE_THEMES: Record<
  string,
  {
    boxBg: string;
    mapFill: string;
    order: number;
    officialConstituencies: number;
  }
> = {
  "uttar-pradesh": {
    boxBg: "bg-[#EEF5FF]",
    mapFill: "#3B82F6",
    order: 1,
    officialConstituencies: 403,
  },
  punjab: {
    boxBg: "bg-[#FFF0F3]",
    mapFill: "#FB7185",
    order: 2,
    officialConstituencies: 117,
  },
  uttarakhand: {
    boxBg: "bg-[#EDFAF3]",
    mapFill: "#10B981",
    order: 3,
    officialConstituencies: 70,
  },
  goa: {
    boxBg: "bg-[#FFF6EC]",
    mapFill: "#F59E0B",
    order: 4,
    officialConstituencies: 40,
  },
  manipur: {
    boxBg: "bg-[#F5EEFF]",
    mapFill: "#A855F7",
    order: 5,
    officialConstituencies: 60,
  },
  "himachal-pradesh": {
    boxBg: "bg-[#EDF8FF]",
    mapFill: "#06B6D4",
    order: 6,
    officialConstituencies: 68,
  },
  gujarat: {
    boxBg: "bg-[#F2EDFF]",
    mapFill: "#8B5CF6",
    order: 7,
    officialConstituencies: 182,
  },
};

export function AvailableStatesSection({ states }: { states: StateItem[] }) {
  const { locale } = useLocale();

  // Sort states strictly according to the specified 7 active states order
  const activeStates = [...states]
    .filter((s) => STATE_THEMES[s.slug])
    .sort((a, b) => (STATE_THEMES[a.slug]?.order ?? 99) - (STATE_THEMES[b.slug]?.order ?? 99));

  return (
    <section className="py-7 sm:py-9 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900">
              {locale === "hi" ? "उपलब्ध राज्य" : "Available States"}
            </h2>
            <p className="hidden sm:block mt-1 text-sm sm:text-base font-medium text-slate-600">
              {locale === "hi"
                ? "जिन राज्यों में वर्तमान में सर्वेक्षण सक्रिय है"
                : "States where survey participation is currently active"}
            </p>
          </div>
          <Link
            href="/rajya"
            className="group inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
          >
            <span>{locale === "hi" ? "सभी राज्यों को देखें" : "View All States"}</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 7 State Cards Grid: 2 columns on mobile matching crop_mobile_states.png; 7 columns on desktop matching crop_states.png */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-7">
          {activeStates.map((state, i) => {
            const theme = STATE_THEMES[state.slug] ?? {
              boxBg: "bg-[#EEF5FF]",
              mapFill: "#3B82F6",
              order: i + 1,
              officialConstituencies: state._count.constituencies,
            };

            const count = state._count?.constituencies || theme.officialConstituencies;

            return (
              <div key={state.slug} className="h-full">
                <Link
                  href={`/${state.slug}`}
                  className="group relative rounded-2xl border border-slate-100/90 bg-white p-2.5 sm:p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-full flex flex-row items-center justify-between lg:flex-col lg:justify-between min-h-[68px] lg:min-h-[185px]"
                >
                  {/* Map Icon Box: Compact on mobile, prominent on desktop */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-full lg:h-26 rounded-xl lg:rounded-2xl ${theme.boxBg} flex items-center justify-center p-1.5 lg:p-2.5 shrink-0 group-hover:scale-[1.02] transition-transform`}
                  >
                    <StateMap
                      slug={state.slug}
                      className="h-8 w-8 sm:h-9 sm:w-9 lg:h-20 lg:w-20 object-contain drop-shadow-xs"
                      fill={theme.mapFill}
                    />
                  </div>

                  {/* State Name & Seat Count */}
                  <div className="flex-1 min-w-0 mx-2 lg:mx-0 lg:mt-3 lg:w-full">
                    <h3 className="font-display text-sm sm:text-[15px] lg:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                      {displayStateName(state.name, state.slug, locale)}
                    </h3>
                    <div className="mt-1 text-xs sm:text-[13px] text-slate-600 font-medium">
                      <span className="font-black text-slate-900">{count}</span>
                      <span className="hidden lg:inline ml-1 text-slate-500 font-medium">
                        {locale === "hi" ? "विधानसभा क्षेत्र" : "Constituencies"}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="shrink-0 flex items-center justify-end">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-sky-400/80 text-sky-500 flex items-center justify-center group-hover:border-sky-500 group-hover:bg-sky-50 transition-colors">
                      <ArrowRight size={13} strokeWidth={2.2} />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
