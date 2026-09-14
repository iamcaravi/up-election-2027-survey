"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// Error boundaries must be Client Components (Next.js requirement) — reads
// the locale from the same canonical LocaleContext every other client
// component uses (see LocaleProvider.tsx), rather than a second source, so
// this stays in sync with whatever the visitor actually has selected.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-extrabold text-foreground">{t.common.error}</h1>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        {t.common.retry}
      </button>
    </div>
  );
}
