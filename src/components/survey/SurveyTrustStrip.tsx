"use client";

import { Users, ShieldCheck, Activity, Megaphone } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function SurveyTrustStrip() {
  const { t } = useLocale();
  const items = [
    { icon: Users, title: t.surveyFlow.trustParticipationTitle, body: t.surveyFlow.trustParticipationBody },
    { icon: ShieldCheck, title: t.surveyFlow.trustPrivacyTitle, body: t.surveyFlow.trustPrivacyBody },
    { icon: Activity, title: t.surveyFlow.trustDataTitle, body: t.surveyFlow.trustDataBody },
    { icon: Megaphone, title: t.surveyFlow.trustVoiceTitle, body: t.surveyFlow.trustVoiceBody },
  ];

  return (
    <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-8 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink">
            <item.icon size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink">{item.title}</p>
            <p className="truncate text-sm text-muted">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
