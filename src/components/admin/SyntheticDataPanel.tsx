"use client";

import { useEffect, useState } from "react";
import { StateSelector } from "./selectors/StateSelector";
import { ConstituencySelector } from "./selectors/ConstituencySelector";
import { cn } from "@/lib/utils";

interface Status {
  enabled: boolean;
  syntheticResponseCount: number;
  realResponseCount: number;
}

export function SyntheticDataPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [stateId, setStateId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");

  function refreshStatus() {
    setLoadingStatus(true);
    fetch("/api/admin/synthetic-data")
      .then((res) => res.json())
      .then(setStatus)
      .finally(() => setLoadingStatus(false));
  }

  useEffect(refreshStatus, []);

  async function setMode(enabled: boolean) {
    setBusy(enabled ? "enable" : "disable");
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/synthetic-data", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update Demo Data Mode.");
      refreshStatus();
      setFeedback({ kind: "success", message: enabled ? "Demo Data Mode enabled — public results now show synthetic data." : "Demo Data Mode disabled — public results now show real data again." });
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Failed." });
    } finally {
      setBusy(null);
    }
  }

  async function regenerateAll() {
    if (!confirm("This regenerates synthetic data for all 403 constituencies and can take a few minutes. Continue?")) return;
    setBusy("regenerate-all");
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/synthetic-data/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Generation failed.");
      refreshStatus();
      setFeedback({
        kind: "success",
        message: `Generated ${body.responsesCreated.toLocaleString()} synthetic responses across ${body.constituenciesProcessed} constituencies.`,
      });
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Generation failed." });
    } finally {
      setBusy(null);
    }
  }

  async function regenerateOne() {
    if (!constituencyId) {
      setFeedback({ kind: "error", message: "Select a constituency first." });
      return;
    }
    setBusy("regenerate-one");
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/synthetic-data/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constituencyId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Generation failed.");
      refreshStatus();
      setFeedback({ kind: "success", message: `Generated ${body.responsesCreated.toLocaleString()} synthetic responses for this constituency.` });
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Generation failed." });
    } finally {
      setBusy(null);
    }
  }

  async function clearAll() {
    if (!confirm("This permanently deletes ALL synthetic demo responses (real responses are never touched). Continue?")) return;
    setBusy("clear");
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/synthetic-data/clear", { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Clear failed.");
      refreshStatus();
      setFeedback({ kind: "success", message: `Deleted ${body.deleted.toLocaleString()} synthetic responses.` });
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Clear failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="card-surface rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink">Demo Data Mode</p>
            <p className="mt-1 text-xs text-muted">
              When enabled, every public results page (constituency and statewide) reads synthetic demo responses
              instead of real ones, and shows a visible &quot;DEMO • SIMULATED&quot; notice. Real responses are never
              deleted or altered by this toggle.
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
              status?.enabled ? "bg-amber-100 text-amber-800" : "bg-surface-2 text-muted"
            )}
          >
            {loadingStatus ? "…" : status?.enabled ? "ENABLED" : "DISABLED"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode(true)}
            disabled={busy !== null || status?.enabled}
            className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {busy === "enable" ? "Enabling…" : "Enable Synthetic Data"}
          </button>
          <button
            type="button"
            onClick={() => setMode(false)}
            disabled={busy !== null || !status?.enabled}
            className="rounded-full border border-border px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {busy === "disable" ? "Disabling…" : "Disable Synthetic Data"}
          </button>
        </div>

        {!loadingStatus && status && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5">
              <p className="text-xs text-muted">Synthetic responses in DB</p>
              <p className="mt-0.5 font-display text-lg font-bold text-ink">{status.syntheticResponseCount.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5">
              <p className="text-xs text-muted">Real responses in DB</p>
              <p className="mt-0.5 font-display text-lg font-bold text-ink">{status.realResponseCount.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <p className={cn("text-sm font-medium", feedback.kind === "success" ? "text-positive" : "text-danger")}>{feedback.message}</p>
      )}

      <div className="card-surface rounded-2xl p-5">
        <p className="text-sm font-bold text-ink">Regenerate Synthetic Dataset (all 403 constituencies)</p>
        <p className="mt-1 text-xs text-muted">
          Generates 500–1,500 varied synthetic responses per constituency (party preference, main issue, and
          demographic answers). Replaces any synthetic data already there. This can take a few minutes — the page
          will wait for it to finish.
        </p>
        <button
          type="button"
          onClick={regenerateAll}
          disabled={busy !== null}
          className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
        >
          {busy === "regenerate-all" ? "Generating for all 403 constituencies…" : "Regenerate Synthetic Dataset"}
        </button>
      </div>

      <div className="card-surface rounded-2xl p-5">
        <p className="text-sm font-bold text-ink">Regenerate One Constituency</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <StateSelector value={stateId} onChange={(id) => { setStateId(id); setConstituencyId(""); }} />
          <ConstituencySelector stateId={stateId} value={constituencyId} onChange={setConstituencyId} />
        </div>
        <button
          type="button"
          onClick={regenerateOne}
          disabled={busy !== null || !constituencyId}
          className="mt-3 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
        >
          {busy === "regenerate-one" ? "Generating…" : "Regenerate This Constituency"}
        </button>
      </div>

      <div className="card-surface rounded-2xl border-danger/30 p-5">
        <p className="text-sm font-bold text-ink">Clear Synthetic Data</p>
        <p className="mt-1 text-xs text-muted">Permanently deletes every synthetic_demo response and answer. Real survey data is never affected.</p>
        <button
          type="button"
          onClick={clearAll}
          disabled={busy !== null}
          className="mt-3 rounded-full border border-danger/40 px-5 py-2.5 text-sm font-bold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
        >
          {busy === "clear" ? "Clearing…" : "Clear Synthetic Data"}
        </button>
      </div>
    </div>
  );
}
