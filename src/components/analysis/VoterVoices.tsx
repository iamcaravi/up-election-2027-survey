"use client";

import { Quote } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { resolveOptionLabel } from "@/lib/option-labels";
import type { VoterVoice } from "@/lib/state-analysis";

// The database has no free-text public-comment field (SurveyAnswer only
// stores structured option selections) — so these are NOT quotes from any
// individual respondent. Each card is a short, generic sentence generated
// from one real, actually-available top_issue bucket (getStateAnalysis's
// computeVoterVoices) — either the overall top issue, or the top issue
// within one real demographic group (youngest age band / women) — always
// attributed to "N respondents who selected this" rather than a fabricated
// persona (name/age/gender/constituency), which would misrepresent an
// aggregate as an individual's statement.
export function VoterVoices({ voices }: { voices: VoterVoice[] }) {
  const { t, locale } = useLocale();

  if (voices.length === 0) {
    return <p className="text-sm text-muted">{t.analysisHub.notEnoughTakeaways}</p>;
  }

  const issueName = (v: VoterVoice) => resolveOptionLabel(v.issueKey, { label: v.issueLabel }, locale, t.surveyQuestions.options);
  const groupName = (v: Extract<VoterVoice, { kind: "age" | "gender" | "religion" }>) =>
    resolveOptionLabel(v.groupKey, { label: v.groupLabel }, locale, t.surveyQuestions.options);

  return (
    <div>
      <span className="mb-3 inline-block rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
        {t.analysisHub.dataDerivedBadge}
      </span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {voices.map((voice, index) => (
          <div key={`${voice.kind}-${voice.issueKey}-${index}`} className="card-surface rounded-2xl p-4">
            <Quote size={18} className="text-accent" />
            <p className="mt-2 font-display text-sm font-semibold leading-relaxed text-foreground">
              {voice.kind === "issue"
                ? t.analysisHub.voiceIssueTemplate.replace("{issue}", issueName(voice))
                : t.analysisHub.voiceGroupTemplate.replace("{group}", groupName(voice)).replace("{issue}", issueName(voice))}
            </p>
            <p className="mt-3 text-xs text-muted">
              {t.analysisHub.voiceRespondentCount
                .replace("{count}", formatNumber(voice.respondentCount))
                .replace("{respondentsSuffix}", t.analysisHub.respondentsSuffix)}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">{t.analysisHub.voterVoicesNote}</p>
    </div>
  );
}
