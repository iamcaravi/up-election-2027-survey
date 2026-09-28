"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { formatNumber } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// The site's ONE online/visitor counter (backed by /api/presence and the
// visitor_presence table). Mounted once, in the global footer — the footer
// lives in the root layout, so this component (and its heartbeat timer)
// persists across client-side navigations instead of re-mounting per page.
//
// Every 25s, but only while the tab is actually visible — avoids sending
// heartbeats (and DB writes) for backgrounded/inactive tabs.
const HEARTBEAT_INTERVAL_MS = 25 * 1000;

interface PresenceStats {
  live: number;
  total: number;
}

// One heartbeat in flight per page, shared across (re)mounts, so a remount
// never races an unfinished heartbeat with a read that would miss it.
let pendingHeartbeat: Promise<PresenceStats | null> | null = null;

async function sendHeartbeat(): Promise<PresenceStats | null> {
  try {
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: getDeviceFingerprint() }),
    });
    return res.ok ? ((await res.json()) as PresenceStats) : null;
  } catch {
    return null;
  }
}

interface VisitorPresenceProps {
  className?: string;
  dividerClassName?: string;
}

export function VisitorPresence({ className, dividerClassName }: VisitorPresenceProps = {}) {
  const { t } = useLocale();
  const [stats, setStats] = useState<PresenceStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    // The heartbeat POST already returns fresh counts, so it is the only
    // request made per tick; the read-only GET is used just as a fallback
    // (e.g. when a heartbeat is rate-limited or fails).
    // Full page loads remount the footer; without this, fast reloads would
    // each send a heartbeat and trip the per-visitor rate limit (429). A
    // heartbeat sent by this tab in the last 20s is still "live", so a quick
    // reload just reads the counts instead.
    const RECENT_MS = 20 * 1000;
    const readLast = () => {
      try {
        return Number(sessionStorage.getItem("vs_presence_hb") || 0);
      } catch {
        return 0;
      }
    };
    const markSent = () => {
      try {
        sessionStorage.setItem("vs_presence_hb", String(Date.now()));
      } catch {
        // storage unavailable (private mode) — heartbeats still work
      }
    };

    async function read() {
      try {
        const res = await fetch("/api/presence", { cache: "no-store" });
        if (!res.ok) return;
        const data: PresenceStats = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // Keep the last known counts (or "—") — never show invented numbers.
      }
    }

    async function tick() {
      if (pendingHeartbeat) {
        const shared = await pendingHeartbeat;
        if (shared && !cancelled) return setStats(shared);
        return read();
      }
      if (Date.now() - readLast() < RECENT_MS) return read();
      markSent();
      pendingHeartbeat = sendHeartbeat();
      const data = await pendingHeartbeat;
      pendingHeartbeat = null;
      if (data) {
        if (!cancelled) setStats(data);
      } else {
        await read();
      }
    }

    tick();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") tick();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const liveText = stats ? formatNumber(stats.live) : "—";
  const totalText = stats ? formatNumber(stats.total) : "—";

  return (
    <div
      className={className || "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted"}
      aria-live="polite"
    >
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-emerald-500 [animation:presence-pulse_1.8s_ease-in-out_infinite]" />
        </span>
        {t.presence.liveNow.replace("{count}", liveText)}
      </span>
      <span className={dividerClassName || "text-border"} aria-hidden="true">
        |
      </span>
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <Eye size={13} className="shrink-0" aria-hidden="true" />
        {t.presence.totalVisitors}: {totalText}
      </span>
    </div>
  );
}
