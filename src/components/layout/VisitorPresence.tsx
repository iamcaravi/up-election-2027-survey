"use client";

import { useEffect, useState } from "react";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { formatNumber } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// Every 25s, but only while the tab is actually visible — avoids sending
// heartbeats (and DB writes) for backgrounded/inactive tabs.
const HEARTBEAT_INTERVAL_MS = 25 * 1000;

interface PresenceStats {
  live: number;
  total: number;
}

export function VisitorPresence() {
  const { t } = useLocale();
  const [stats, setStats] = useState<PresenceStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function heartbeat() {
      try {
        const fingerprint = getDeviceFingerprint();
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fingerprint }),
        });
        if (!res.ok) throw new Error("presence request failed");
        const data: PresenceStats = await res.json();
        if (!cancelled) {
          setStats(data);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    heartbeat();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") heartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unavailable = failed && !stats;
  const liveText = unavailable ? t.presence.unavailable : stats ? formatNumber(stats.live) : "—";
  const totalText = unavailable ? t.presence.unavailable : stats ? formatNumber(stats.total) : "—";
  const liveLine = t.presence.liveNow.replace("{count}", liveText);

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="absolute inset-0 rounded-full bg-positive [animation:presence-pulse_1.8s_ease-in-out_infinite]" aria-hidden="true" />
        </span>
        {liveLine}
      </span>
      <span className="hidden text-border sm:inline" aria-hidden="true">
        |
      </span>
      <span className="whitespace-nowrap">
        {t.presence.totalVisitors}: {totalText}
      </span>
    </div>
  );
}
