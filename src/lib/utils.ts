import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

// Presentation-only Hindi display names for states that are actually
// configured in the database (State.name itself has no per-locale field).
// Deliberately kept to states we currently launch with — do not pre-populate
// entries for future/unconfigured states. Falls back to the real DB name
// (English) for anything not listed, so nothing here can misrepresent data.
const STATE_NAME_HI: Record<string, string> = {
  "uttar-pradesh": "उत्तर प्रदेश",
};

export function displayStateName(name: string, slug: string, locale: "hi" | "en"): string {
  if (locale === "hi") return STATE_NAME_HI[slug] ?? name;
  return name;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
