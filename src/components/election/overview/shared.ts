import { formatNumber } from "@/lib/utils";

// Data contract for the Election Overview page. Every value comes from the
// database via src/app/[state]/elections/[election]/page.tsx — nothing here
// is state-specific, so one component tree serves every state.
export interface ElectionOverviewData {
  hi: boolean;
  stateName: string;
  electionYear: number;
  electionStatus: string;
  /** Official polling date, only when the database actually has one. */
  electionDate: Date | null;
  districtCount: number | null;
  constituencyCount: number | null;
  /** Distinct constituencies with at least one valid response. */
  surveyedAreaCount: number | null;
  /** Valid survey responses for this election. */
  participantCount: number | null;
  links: {
    constituencies: string;
    districts: string;
    survey: string;
  };
}

export const NAVY = "text-[#0f1f4b]";

export const CARD =
  "rounded-2xl border border-[#e2e8f1] bg-white shadow-[0_1px_2px_rgba(15,31,75,0.04),0_6px_16px_-10px_rgba(15,31,75,0.12)]";

export const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f1f4b]/40 focus-visible:ring-offset-2";

/** Zero or missing counts are shown as "not available" rather than a number. */
export function hasValue(n: number | null): n is number {
  return typeof n === "number" && n > 0;
}

export function unavailable(hi: boolean) {
  return hi ? "डेटा उपलब्ध नहीं" : "Data not available";
}

export function countLabel(n: number | null, hi: boolean, unitHi: string, unitEn: string) {
  return hasValue(n) ? `${formatNumber(n)} ${hi ? unitHi : unitEn}` : `${hi ? unitHi : unitEn}: ${unavailable(hi)}`;
}

export function statusLabel(status: string, hi: boolean) {
  switch (status) {
    case "ONGOING":
      return hi ? "चुनाव जारी" : "Ongoing Election";
    case "COMPLETED":
      return hi ? "संपन्न चुनाव" : "Completed Election";
    default:
      return hi ? "आगामी चुनाव" : "Upcoming Election";
  }
}

export function formatElectionDate(date: Date, hi: boolean) {
  return new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function scheduleAwaited(hi: boolean) {
  return hi ? "चुनाव कार्यक्रम की आधिकारिक घोषणा प्रतीक्षित" : "Official election schedule awaited";
}
