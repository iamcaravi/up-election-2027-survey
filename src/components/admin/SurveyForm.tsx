"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea, Checkbox, ErrorBanner } from "./FormField";
import { StateSelector } from "./selectors/StateSelector";
import { ElectionSelector } from "./selectors/ElectionSelector";
import { DistrictSelector } from "./selectors/DistrictSelector";
import { ConstituencySelector } from "./selectors/ConstituencySelector";

const SURVEY_STATUSES = ["ACTIVE", "CLOSED", "DRAFT"] as const;

interface InitialSurvey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  isActive: boolean;
  minimumSampleSize: number | null;
  responseCount: number;
  election: { id: string; name: string; year: number; state: { id: string; name: string } };
  constituency: { id: string; name: string; number: number; district: { id: string; name: string } };
}

export function SurveyForm({ initial, initialStateId }: { initial?: InitialSurvey; initialStateId?: string }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [stateId, setStateId] = useState(initial?.election.state.id ?? initialStateId ?? "");
  const [electionId, setElectionId] = useState(initial?.election.id ?? "");
  const [districtId, setDistrictId] = useState(initial?.constituency.district.id ?? "");
  const [constituencyId, setConstituencyId] = useState(initial?.constituency.id ?? "");

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [minimumSampleSize, setMinimumSampleSize] = useState(
    initial?.minimumSampleSize != null ? String(initial.minimumSampleSize) : ""
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStateChange(id: string) {
    setStateId(id);
    setElectionId("");
    setDistrictId("");
    setConstituencyId("");
  }
  function handleDistrictChange(id: string) {
    setDistrictId(id);
    setConstituencyId("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const url = isEdit ? `/api/admin/surveys/${initial!.id}` : "/api/admin/surveys";
    const payload = isEdit
      ? {
          title,
          description: description || null,
          status,
          isActive,
          minimumSampleSize: minimumSampleSize ? Number(minimumSampleSize) : null,
        }
      : {
          electionId,
          constituencyId,
          title,
          description: description || undefined,
          isActive,
          minimumSampleSize: minimumSampleSize ? Number(minimumSampleSize) : undefined,
        };

    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    router.push("/admin/surveys");
    router.refresh();
  }

  async function remove() {
    if (!initial) return;
    if (!confirm(`Delete survey "${initial.title}"? This only works if it has no responses.`)) return;
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/admin/surveys/${initial.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setDeleting(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not delete survey.");
      return;
    }
    router.push("/admin/surveys");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card-surface max-w-2xl space-y-5 rounded-2xl p-6">
      {error && <ErrorBanner message={error} />}

      {isEdit ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm">
          <p className="font-semibold">
            {initial!.election.state.name} · {initial!.election.name} ({initial!.election.year})
          </p>
          <p className="mt-1 text-muted">
            AC #{initial!.constituency.number} · {initial!.constituency.name} ({initial!.constituency.district.name})
          </p>
          <p className="mt-2 text-xs text-muted">
            Election and constituency cannot be changed after creation — this preserves the meaning of any existing
            responses. {initial!.responseCount > 0 && (
              <strong className="text-foreground">
                This survey has {initial!.responseCount} response(s); it can be disabled but not deleted.
              </strong>
            )}
          </p>
          <Link href={`/admin/analytics/${initial!.id}`} className="mt-3 inline-block text-xs font-semibold text-ink underline underline-offset-2">
            View aggregate analytics (internal engine preview) →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StateSelector value={stateId} onChange={handleStateChange} required />
          <ElectionSelector stateId={stateId} value={electionId} onChange={setElectionId} required />
          <DistrictSelector stateId={stateId} value={districtId} onChange={handleDistrictChange} required />
          <ConstituencySelector stateId={stateId} districtId={districtId} value={constituencyId} onChange={setConstituencyId} required />
        </div>
      )}

      <Field label="Survey title" required>
        <TextInput value={title} onChange={setTitle} required placeholder="e.g. Etmadpur — 2027 विधानसभा सर्वे" />
      </Field>

      <Field label="Description (optional)">
        <TextArea value={description} onChange={setDescription} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        {isEdit && (
          <Field label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
            >
              {SURVEY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Minimum sample size (optional — falls back to the site-wide default)">
          <TextInput type="number" value={minimumSampleSize} onChange={setMinimumSampleSize} placeholder="30" />
        </Field>
      </div>

      <Checkbox checked={isActive} onChange={setIsActive} label="Active (publicly visible and accepting responses)" />

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving || (!isEdit && (!stateId || !electionId || !districtId || !constituencyId))}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create survey"}
        </Button>
        {isEdit && (
          <Button type="button" size="sm" variant="ghost" className="text-danger" onClick={remove} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete survey"}
          </Button>
        )}
      </div>
    </form>
  );
}
