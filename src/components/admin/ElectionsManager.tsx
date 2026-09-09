"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea, Checkbox, ErrorBanner } from "./FormField";
import { StateSelector } from "./selectors/StateSelector";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface ElectionRow {
  id: string;
  name: string;
  slug: string;
  year: number;
  electionType: string;
  status: string;
  isActive: boolean;
  _count: { candidates: number; surveys: number; electionConstituencies: number };
}

const ELECTION_TYPES = ["ASSEMBLY", "LOK_SABHA", "LOCAL"] as const;
const ELECTION_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED"] as const;

const emptyForm = {
  name: "",
  slug: "",
  year: new Date().getFullYear(),
  electionType: "ASSEMBLY" as (typeof ELECTION_TYPES)[number],
  status: "UPCOMING" as (typeof ELECTION_STATUSES)[number],
  description: "",
  isActive: true,
};

export function ElectionsManager() {
  const searchParams = useSearchParams();
  const [stateId, setStateId] = useState(searchParams.get("stateId") ?? "");
  const [elections, setElections] = useState<ElectionRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stateId) {
      setElections(null);
      return;
    }
    setListError(null);
    const res = await fetch(`/api/admin/elections?stateId=${stateId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load elections.");
      return;
    }
    setElections(data);
  }, [stateId]);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function startEdit(e: ElectionRow) {
    setEditingId(e.id);
    setForm({
      name: e.name,
      slug: e.slug,
      year: e.year,
      electionType: e.electionType as (typeof ELECTION_TYPES)[number],
      status: e.status as (typeof ELECTION_STATUSES)[number],
      description: "",
      isActive: e.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = editingId
      ? {
          name: form.name,
          slug: form.slug || undefined,
          year: form.year,
          electionType: form.electionType,
          status: form.status,
          description: form.description || undefined,
          isActive: form.isActive,
        }
      : {
          stateId,
          name: form.name,
          slug: form.slug || undefined,
          year: form.year,
          electionType: form.electionType,
          status: form.status,
          description: form.description || undefined,
          isActive: form.isActive,
        };
    const res = await fetch(editingId ? `/api/admin/elections/${editingId}` : "/api/admin/elections", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    setShowForm(false);
    await load();
  }

  async function remove(e: ElectionRow) {
    if (!confirm(`Delete election "${e.name}"? This only works if it has no candidates, surveys or constituency mappings.`)) return;
    const res = await fetch(`/api/admin/elections/${e.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not delete election.");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="max-w-sm">
        <StateSelector value={stateId} onChange={setStateId} required />
      </div>

      {stateId && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={startCreate}>
            <Plus size={15} /> Add Election
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="card-surface mt-4 space-y-4 rounded-2xl p-5">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <TextInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required placeholder="e.g. Maharashtra Assembly Election 2029" />
            </Field>
            <Field label="Year" required>
              <TextInput type="number" value={String(form.year)} onChange={(v) => setForm((f) => ({ ...f, year: Number(v) || f.year }))} required />
            </Field>
            <Field label="Slug (auto-generated from name if left blank)">
              <TextInput value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} placeholder="e.g. assembly-2029" />
            </Field>
            <Field label="Type">
              <select
                value={form.electionType}
                onChange={(e) => setForm((f) => ({ ...f, electionType: e.target.value as (typeof ELECTION_TYPES)[number] }))}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              >
                {ELECTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as (typeof ELECTION_STATUSES)[number] }))}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              >
                {ELECTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Description (optional)">
            <TextArea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} />
          </Field>
          <Checkbox checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active" />
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create election"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {stateId && (
        <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="p-3">Name</th>
                <th className="p-3">Year</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Candidates</th>
                <th className="p-3">Surveys</th>
                <th className="p-3">Constituencies</th>
                <th className="p-3">Active</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {listError && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-danger">
                    {listError}
                  </td>
                </tr>
              )}
              {!listError && elections === null && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              )}
              {!listError && elections?.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted">
                    No elections in this state yet.
                  </td>
                </tr>
              )}
              {elections?.map((e) => (
                <tr key={e.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">
                    <Link href={`/admin/election-constituencies?electionId=${e.id}&stateId=${stateId}`} className="hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td className="p-3">{e.year}</td>
                  <td className="p-3 text-muted">{e.electionType.replace("_", " ")}</td>
                  <td className="p-3 text-muted">{e.status}</td>
                  <td className="p-3">{e._count.candidates}</td>
                  <td className="p-3">{e._count.surveys}</td>
                  <td className="p-3">{e._count.electionConstituencies}</td>
                  <td className="p-3">
                    <span className={e.isActive ? "text-positive" : "text-muted"}>{e.isActive ? "Yes" : "No"}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => startEdit(e)} className="text-ink hover:opacity-70" aria-label={`Edit ${e.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(e)} className="text-danger hover:opacity-70" aria-label={`Delete ${e.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
