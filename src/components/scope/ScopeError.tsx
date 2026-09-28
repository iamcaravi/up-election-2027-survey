"use client";

import { RotateCcw } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** User-facing error state for the Result / Analysis pages (no stack traces). */
export function ScopeError({ kind, reset }: { kind: "results" | "analysis"; reset: () => void }) {
  const { locale } = useLocale();
  const hi = locale === "hi";
  const message =
    kind === "results"
      ? hi
        ? "परिणाम लोड नहीं हो सके। कृपया थोड़ी देर बाद फिर प्रयास करें।"
        : "Results could not be loaded. Please try again shortly."
      : hi
        ? "विश्लेषण लोड नहीं हो सका। कृपया थोड़ी देर बाद फिर प्रयास करें।"
        : "The analysis could not be loaded. Please try again shortly.";
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-lg font-bold text-slate-800">{message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0f1f4b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2d63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      >
        <RotateCcw size={16} aria-hidden="true" />
        {hi ? "फिर प्रयास करें" : "Try again"}
      </button>
    </div>
  );
}
