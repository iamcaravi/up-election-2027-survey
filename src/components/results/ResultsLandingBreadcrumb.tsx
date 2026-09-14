"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function ResultsLandingBreadcrumb() {
  const { t } = useLocale();
  return <Breadcrumb items={[{ label: t.resultsHub.eyebrow }]} />;
}
