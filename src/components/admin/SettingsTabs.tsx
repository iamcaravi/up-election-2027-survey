"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Globe2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const TABS = [
  "General",
  "Survey Settings",
  "Results & Visibility",
  "Premium Features",
  "Compliance",
  "Appearance",
  "Notifications",
  "Integrations",
] as const;
type Tab = (typeof TABS)[number];

export function SettingsTabs({
  minGroupSize,
  electionPeriod,
  updatedAt,
}: {
  minGroupSize: number;
  electionPeriod: { restricted: boolean; note: string };
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("General");
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
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors",
              tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {tab === "General" && <GeneralTab />}

          {tab === "Survey Settings" && (
            <SectionCard icon={<Globe2 size={17} />} title="Data & Privacy" description="Configure data handling and privacy settings.">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
                  Minimum Responses for Public Results
                </label>
                <p className="mb-2 text-xs text-muted">
                  Breakdowns with fewer valid responses than this are hidden in the premium analytics dashboard to
                  protect respondent privacy. Public constituency results themselves are shown from the first
                  response by design and are not gated by this number.
                </p>
                <input
                  type="number"
                  min={5}
                  max={1000}
                  value={minGroup}
                  onChange={(e) => setMinGroup(Number(e.target.value))}
                  className="h-11 w-32 rounded-lg border border-border bg-surface px-3.5 text-sm"
                />
              </div>
            </SectionCard>
          )}

          {tab === "Results & Visibility" && (
            <SectionCard icon={<ShieldCheck size={17} />} title="Site Status" description="Control result visibility during restricted periods.">
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={restricted} onChange={(e) => setRestricted(e.target.checked)} />
                Silence Mode (During Election Period)
              </label>
              <p className="mb-2 text-xs text-muted">
                Use Silence Mode during the official election period, per ECI guidelines — this hides live results
                from the public while restricted.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="Optional note about current restriction"
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm"
              />
            </SectionCard>
          )}

          {(tab === "Premium Features" || tab === "Appearance" || tab === "Notifications" || tab === "Integrations") && (
            <SectionCard icon={<Globe2 size={17} />} title={tab} description="Coming soon.">
              <p className="text-sm text-muted">
                This section isn&apos;t wired to a backend setting yet — it will appear here once that functionality
                ships.
              </p>
            </SectionCard>
          )}

          {tab === "Compliance" && (
            <SectionCard icon={<ShieldCheck size={17} />} title="Compliance" description="Statutory and platform-wide compliance notes.">
              <p className="text-sm text-muted">
                Use the <strong>Results &amp; Visibility</strong> tab&apos;s Silence Mode toggle during the Election
                Commission&apos;s statutory silence period.
              </p>
            </SectionCard>
          )}
        </div>

        <div className="card-surface h-fit space-y-4 rounded-2xl p-5">
          <h3 className="font-display text-sm font-bold text-ink">Save Changes</h3>
          {saved && (
            <p className="flex items-center gap-1.5 rounded-lg bg-positive/10 px-3 py-2 text-xs font-semibold text-positive">
              <CheckCircle2 size={14} /> Your settings are secure and encrypted.
            </p>
          )}
          <Button variant="primary" className="w-full justify-center gap-2" onClick={save} disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save All Changes"}
          </Button>
          {updatedAt && <p className="text-xs text-muted">Last updated: {updatedAt}</p>}
        </div>
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <>
      <SectionCard icon={<Globe2 size={17} />} title="General Settings" description="Basic configuration for the platform.">
        <ReadOnlyField label="Website Name" value="votersurvey.in" />
        <ReadOnlyField label="Tagline" value="जनता की राय, बेहतर कल के लिए" />
        <p className="mt-1 text-xs text-muted">
          These are currently fixed brand constants, not yet backed by an editable setting.
        </p>
      </SectionCard>
    </>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">{icon}</span>
        <div>
          <h2 className="font-display text-base font-bold text-ink">{title}</h2>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        readOnly
        value={value}
        className="h-11 w-full cursor-not-allowed rounded-lg border border-border bg-surface-2 px-3.5 text-sm text-muted"
      />
    </div>
  );
}
