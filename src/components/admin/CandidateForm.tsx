"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StateSelector } from "./selectors/StateSelector";
import { ElectionSelector } from "./selectors/ElectionSelector";
import { DistrictSelector } from "./selectors/DistrictSelector";
import { ConstituencySelector } from "./selectors/ConstituencySelector";
import { Button } from "@/components/ui/Button";
import { CANDIDATE_STATUSES, CONFIDENCE_SCORES, CANDIDATE_STATUS_LABELS } from "@/lib/enums";

interface Party {
  id: string;
  shortName: string;
}

interface InitialCandidate {
  id: string;
  name: string;
  nameHindi: string | null;
  partyId: string | null;
  status: string;
  confidenceScore: string;
  currentOffice: string | null;
  background: string | null;
  sourceNotes: string | null;
  verified: boolean;
  photoUrl: string | null;
  photoSourceUrl: string | null;
  photoSourceName: string | null;
  photoLicense: string | null;
  constituency: { id: string; name: string; number: number; district: { name: string } };
}

export function CandidateForm({ initial }: { initial?: InitialCandidate }) {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);

  // Cascading hierarchy — only used in create mode. Changing a parent
  // scope clears every dependent selection so a stale election/district/
  // constituency can never be silently submitted.
  const [stateId, setStateId] = useState("");
  const [electionId, setElectionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [constituencyId, setConstituencyId] = useState(initial?.constituency.id ?? "");

  const [name, setName] = useState(initial?.name ?? "");
  const [nameHindi, setNameHindi] = useState(initial?.nameHindi ?? "");
  const [partyId, setPartyId] = useState(initial?.partyId ?? "");
  const [status, setStatus] = useState(initial?.status ?? "POSSIBLE");
  const [confidenceScore, setConfidenceScore] = useState(initial?.confidenceScore ?? "LOW");
  const [currentOffice, setCurrentOffice] = useState(initial?.currentOffice ?? "");
  const [background, setBackground] = useState(initial?.background ?? "");
  const [sourceNotes, setSourceNotes] = useState(initial?.sourceNotes ?? "");
  const [verified, setVerified] = useState(initial?.verified ?? false);
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [photoSourceUrl, setPhotoSourceUrl] = useState(initial?.photoSourceUrl ?? "");
  const [photoSourceName, setPhotoSourceName] = useState(initial?.photoSourceName ?? "");
  const [photoLicense, setPhotoLicense] = useState(initial?.photoLicense ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/parties").then((r) => r.json()).then(setParties);
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!initial && !constituencyId) {
      setError("Select a constituency.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      constituencyId: initial ? undefined : constituencyId,
      electionId: initial ? undefined : electionId || undefined,
      name,
      nameHindi: nameHindi || undefined,
      partyId: partyId || null,
      status,
      confidenceScore,
      currentOffice: currentOffice || undefined,
      background: background || undefined,
      sourceNotes: sourceNotes || undefined,
      verified,
      photoUrl: photoUrl || undefined,
      photoSourceUrl: photoSourceUrl || undefined,
      photoSourceName: photoSourceName || undefined,
      photoLicense: photoLicense || undefined,
    };

    const res = await fetch(initial ? `/api/admin/candidates/${initial.id}` : "/api/admin/candidates", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/admin/candidates");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface max-w-2xl space-y-5 rounded-2xl p-6">
      {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      {initial ? (
        <Field label="Constituency">
          <p className="text-sm text-muted">
            {initial.constituency.name} ({initial.constituency.district.name}) — constituency cannot be changed after creation.
          </p>
        </Field>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <StateSelector value={stateId} onChange={handleStateChange} required />
          <ElectionSelector stateId={stateId} value={electionId} onChange={setElectionId} required />
          <DistrictSelector stateId={stateId} value={districtId} onChange={handleDistrictChange} required />
          <ConstituencySelector stateId={stateId} districtId={districtId} value={constituencyId} onChange={setConstituencyId} required />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Candidate name">
          <Input value={name} onChange={setName} required />
        </Field>
        <Field label="Name in Hindi (optional — enter/verify manually, never auto-generated)">
          <Input value={nameHindi} onChange={setNameHindi} placeholder="हिन्दी में नाम" />
        </Field>
      </div>

      <Field label="Party (leave unset for independent)">
        <select
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
        >
          <option value="">Independent / Unaffiliated</option>
          {parties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.shortName}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
          >
            {CANDIDATE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CANDIDATE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Confidence">
          <select
            value={confidenceScore}
            onChange={(e) => setConfidenceScore(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
          >
            {CONFIDENCE_SCORES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {status === "INCUMBENT" && (
        <p className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs text-foreground">
          <strong>INCUMBENT</strong> means this person is the <strong>current sitting MLA</strong>. It does{" "}
          <strong>not</strong> mean they are a declared candidate for the 2027 election, and this record will not
          appear as a survey option. Change the status separately once/if an official 2027 candidacy is announced.
        </p>
      )}

      <Field label="">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="h-4 w-4 rounded border-border" />
          <span>
            <strong>Verified</strong> — an admin has checked this record&apos;s name/party/constituency/status against
            the source notes below. Never set automatically by an import.
          </span>
        </label>
      </Field>

      <Field label="Current office (e.g. Sitting MLA — separate from 2027 candidacy status above)">
        <Input value={currentOffice} onChange={setCurrentOffice} />
      </Field>

      <Field label="Short political background">
        <Textarea value={background} onChange={setBackground} />
      </Field>

      <Field label="Source / evidence notes (why this status/confidence — cite where this came from)">
        <Textarea value={sourceNotes} onChange={setSourceNotes} />
      </Field>

      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="mb-3 text-sm font-semibold">Candidate photo (optional)</p>
        <div className="space-y-3">
          <Field label="Image URL">
            <Input value={photoUrl} onChange={setPhotoUrl} placeholder="https://..." />
          </Field>
          <Field label="Source URL (where you found it)">
            <Input value={photoSourceUrl} onChange={setPhotoSourceUrl} placeholder="https://..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Source name">
              <Input value={photoSourceName} onChange={setPhotoSourceName} placeholder="e.g. Wikimedia Commons" />
            </Field>
            <Field label="License / usage status">
              <Input value={photoLicense} onChange={setPhotoLicense} placeholder="e.g. CC BY-SA 4.0" />
            </Field>
          </div>
          <p className="text-xs text-muted">
            New or changed photos are marked PENDING and must be verified in Image Review before being fully trusted.
          </p>
        </div>
      </div>

      <Button type="submit" variant="primary" size="lg" disabled={saving}>
        {saving ? "Saving..." : initial ? "Save changes" : "Create candidate"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  required,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
    />
  );
}

function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
    />
  );
}
