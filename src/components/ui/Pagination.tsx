"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

/** Page numbers with "…" gaps, e.g. 1 2 3 4 5 … 8. */
export function pageItems(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
  if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap", current - 1, current, current + 1, "gap", total];
}

/** Numbered pager — renders nothing when everything fits on one page. */
export function Pagination({
  page,
  totalPages,
  onChange,
  hi,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  hi: boolean;
}) {
  if (totalPages <= 1) return null;
  const arrow = cn(
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[#dfe6f0] bg-white text-blue-600 shadow-[0_1px_2px_rgba(15,31,75,0.05)] disabled:cursor-default disabled:text-slate-300",
    FOCUS
  );
  return (
    <nav aria-label={hi ? "पृष्ठ" : "Pagination"} className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label={hi ? "पिछला पृष्ठ" : "Previous page"} className={arrow}>
        <ChevronLeft size={18} />
      </button>
      {pageItems(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="flex h-9 w-8 items-center justify-center text-sm text-slate-500" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={hi ? `पृष्ठ ${item}` : `Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-semibold transition-colors",
              item === page ? "bg-blue-600 text-white shadow-sm" : "text-[#0f1f4b] hover:bg-slate-100",
              FOCUS
            )}
          >
            {item}
          </button>
        )
      )}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label={hi ? "अगला पृष्ठ" : "Next page"} className={arrow}>
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
