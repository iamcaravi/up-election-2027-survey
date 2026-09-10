"use client";

import { motion } from "framer-motion";
import { CandidateAvatar } from "./CandidateAvatar";
import { StatusBadge, PartyPill } from "@/components/ui/Badge";
import { CANDIDATE_STATUS_LABELS, type CandidateStatus } from "@/lib/enums";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export interface CandidateCardData {
  id: string;
  name: string;
  status: string;
  confidenceScore: string;
  photoUrl?: string | null;
  photoVerified?: boolean;
  currentOffice?: string | null;
  background?: string | null;
  party?: { name: string; shortName: string; colorHex: string } | null;
}

export function CandidateCard({
  candidate,
  index = 0,
  selectable = false,
  selected = false,
  onSelect,
  radioName = "candidate_choice",
  radioValue,
  required = false,
}: {
  candidate: CandidateCardData;
  index?: number;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  radioName?: string;
  radioValue?: string;
  required?: boolean;
}) {
  const status = (candidate.status in CANDIDATE_STATUS_LABELS ? candidate.status : "POSSIBLE") as CandidateStatus;

  const content = (
    <>
      <div className="flex items-start gap-4">
        <CandidateAvatar name={candidate.name} photoUrl={candidate.photoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold">{candidate.name}</p>
          {candidate.party ? (
            <PartyPill shortName={candidate.party.shortName} colorHex={candidate.party.colorHex} className="mt-1.5" />
          ) : (
            <span className="mt-1.5 inline-block text-xs text-muted">Independent / Unaffiliated</span>
          )}
        </div>
        {selectable && (
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
              selected ? "border-ink bg-ink text-white" : "border-border"
            )}
          >
            {selected && <CheckCircle2 size={16} />}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-[11px] font-medium text-muted">
          Confidence: {candidate.confidenceScore}
        </span>
      </div>

      {candidate.background && <p className="mt-3 line-clamp-3 text-sm text-muted">{candidate.background}</p>}
    </>
  );

  const baseClasses = cn(
    "card-surface relative rounded-2xl p-5 transition-[transform,border-color,box-shadow] duration-200",
    selectable && "cursor-pointer hover:-translate-y-0.5",
    selectable && selected && "border-ink ring-2 ring-ink/25"
  );

  const motionProps = {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-30px" },
    transition: { duration: 0.35, delay: (index % 12) * 0.05 },
  };

  if (selectable) {
    return (
      <motion.label
        {...motionProps}
        whileTap={{ scale: 0.98 }}
        className={cn(baseClasses, "block focus-within:ring-2 focus-within:ring-ink/40")}
      >
        <input
          type="radio"
          name={radioName}
          value={radioValue}
          checked={selected}
          required={required}
          onChange={onSelect}
          className="sr-only"
        />
        {content}
      </motion.label>
    );
  }

  return (
    <motion.div {...motionProps} className={baseClasses}>
      {content}
    </motion.div>
  );
}
