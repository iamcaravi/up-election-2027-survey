"use client";

import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export interface SurveyStepDef {
  key: string;
  label: string;
}

export function SurveyStepper({ steps, currentIndex }: { steps: SurveyStepDef[]; currentIndex: number }) {
  const { t } = useLocale();

  const isDone = currentIndex >= steps.length;
  const currentStepNum = Math.min(currentIndex + 1, 4);
  const progressPercent = isDone ? 100 : currentStepNum * 25;

  return (
    <div className="w-full">
      {/* Mobile progress header (< sm:), matching reference designs */}
      <div className="flex sm:hidden flex-col gap-1.5 pt-0.5 pb-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {`Question ${currentStepNum} of 4`}
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {progressPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop stepper (>= sm:) */}
      <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between gap-1.5">
        <ol className="flex min-w-0 flex-1 items-start overflow-x-auto pb-0 scrollbar-thin">
          {steps.map((step, index) => {
            const state = index < currentIndex ? "done" : index === currentIndex ? "active" : "upcoming";
            const isLast = index === steps.length - 1;
            return (
              <li key={step.key} className={cn("flex items-center", !isLast && "flex-1 min-w-[4.5rem]")}>
                <div className="flex flex-col items-center gap-0.5 px-1">
                  <span
                    aria-current={state === "active" ? "step" : undefined}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-7 sm:w-7",
                      state === "active" && "bg-blue-600 text-white ring-4 ring-blue-100",
                      state === "done" && "bg-blue-600 text-white",
                      state === "upcoming" && "bg-surface-2 text-ink ring-1 ring-inset ring-border"
                    )}
                  >
                    {state === "done" ? <Check size={12} /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "whitespace-nowrap text-[10px] font-bold sm:text-[11px]",
                      state === "upcoming" ? "text-muted" : state === "active" ? "text-blue-600" : "text-ink"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn("mx-1 h-0.5 flex-1 rounded-full sm:mx-2", state === "done" ? "bg-blue-600" : "bg-border")}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div className="hidden shrink-0 items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-ink lg:flex">
          <Clock size={16} className="text-blue-600" />
          {t.surveyFlow.timeEstimate}
        </div>
      </div>
    </div>
  );
}
