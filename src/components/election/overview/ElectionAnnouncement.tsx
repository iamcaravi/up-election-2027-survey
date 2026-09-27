import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVY, scheduleAwaited } from "./shared";

/** Neutral notice shown only while the database has no official schedule. */
export function ElectionAnnouncement({ hi }: { hi: boolean }) {
  return (
    <aside
      role="note"
      className="flex items-center gap-4 rounded-2xl border border-blue-200/80 bg-[#eef5ff] p-4 sm:gap-5 sm:px-6"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-blue-100 sm:h-12 sm:w-12">
        <Lightbulb className="h-6 w-6 text-blue-600" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span aria-hidden="true" className="hidden h-10 w-px shrink-0 bg-blue-200 sm:block" />
      <div className="min-w-0">
        <p className={cn("text-[15px] font-bold leading-snug sm:text-base", NAVY)}>{scheduleAwaited(hi)}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-slate-600 sm:text-sm">
          {hi
            ? "आधिकारिक चुनाव कार्यक्रम जारी होने के बाद संबंधित जानकारी यहां उपलब्ध कराई जाएगी।"
            : "Related information will be made available here once the official election schedule is released."}
        </p>
      </div>
    </aside>
  );
}
