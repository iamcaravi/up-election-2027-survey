"use client";

import { Quote } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
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
  const { t } = useLocale();

  if (voices.length === 0) {
    return <p className="text-sm text-muted">{t.analysisHub.notEnoughTakeaways}</p>;
  }

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
                ? t.analysisHub.voiceIssueTemplate.replace("{issue}", voice.issueLabel)
                : t.analysisHub.voiceGroupTemplate.replace("{group}", voice.groupLabel).replace("{issue}", voice.issueLabel)}
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
