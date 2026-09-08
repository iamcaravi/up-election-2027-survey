"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function SettingsForm({
  minGroupSize,
  electionPeriod,
}: {
  minGroupSize: number;
  electionPeriod: { restricted: boolean; note: string };
}) {
  const router = useRouter();
  const [minGroup, setMinGroup] = useState(minGroupSize);
  const [restricted, setRestricted] = useState(electionPeriod.restricted);
  const [note, setNote] = useState(electionPeriod.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await Promise.all([
      fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "MIN_ANALYTICS_GROUP_SIZE", value: minGroup }),
      }),
      fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ELECTION_PERIOD_MODE", value: { restricted, note } }),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="card-surface space-y-6 rounded-2xl p-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Minimum analytics group size</label>
        <p className="mb-2 text-xs text-muted">
          Any breakdown with fewer valid responses than this is hidden to protect respondent privacy and statistical
          reliability.
        </p>
        <input
          type="number"
          min={5}
          max={1000}
          value={minGroup}
          onChange={(e) => setMinGroup(Number(e.target.value))}
          className="h-11 w-32 rounded-xl border border-border bg-surface px-3.5 text-sm"
        />
      </div>

      <div className="border-t border-border pt-6">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
          Election period publication restriction active
        </label>
        <p className="mb-2 text-xs text-muted">
          Enable during the Election Commission&apos;s statutory silence period or other restricted windows.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Optional note about current restriction"
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
        />
      </div>

      <Button variant="primary" onClick={save} disabled={saving}>
        {saving ? "Saving..." : saved ? "Saved" : "Save settings"}
      </Button>
    </div>
  );
}
