"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function FindConstituencyBreadcrumbHeading() {
  const { t } = useLocale();
  return (
    <>
      <Breadcrumb items={[{ label: t.findConstituency.breadcrumbLabel }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{t.findConstituency.heading}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t.findConstituency.subtitle}</p>
    </>
  );
}
