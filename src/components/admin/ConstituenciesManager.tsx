"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, ErrorBanner } from "./FormField";
import { StateSelector } from "./selectors/StateSelector";
import { DistrictSelector } from "./selectors/DistrictSelector";
import { RESERVED_STATUSES } from "@/lib/enums";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface ConstituencyRow {
  id: string;
  number: number;
  name: string;
  slug: string;
  reservedStatus: string;
  district: { id: string; name: string };
  _count: { candidates: number; surveys: number; electionConstituencies: number; surveyResponses: number };
}

const emptyForm = { districtId: "", number: "", name: "", slug: "", reservedStatus: "None" as (typeof RESERVED_STATUSES)[number] };

export function ConstituenciesManager() {
  const searchParams = useSearchParams();
  const [stateId, setStateId] = useState(searchParams.get("stateId") ?? "");
  const [districtFilter, setDistrictFilter] = useState(searchParams.get("districtId") ?? "");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<ConstituencyRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stateId) {
      setRows(null);
      return;
    }
    setListError(null);
    const qs = new URLSearchParams({
      stateId,
      ...(districtFilter ? { districtId: districtFilter } : {}),
      ...(query ? { q: query } : {}),
    });
    const res = await fetch(`/api/admin/constituencies?${qs}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load constituencies.");
      return;
    }
    setRows(data);
  }, [stateId, districtFilter, query]);

  useEffect(() => {
    const handle = setTimeout(load, 200);
    return () => clearTimeout(handle);
  }, [load]);

  // Changing the state clears the dependent district filter and any
  // in-progress form scoped to the old state.
  function handleStateChange(id: string) {
    setStateId(id);
    setDistrictFilter("");
    setShowForm(false);
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, districtId: districtFilter });
    setError(null);
    setShowForm(true);
  }

  function startEdit(c: ConstituencyRow) {
    setEditingId(c.id);
    setForm({
      districtId: c.district.id,
      number: String(c.number),
      name: c.name,
      slug: c.slug,
      reservedStatus: c.reservedStatus as (typeof RESERVED_STATUSES)[number],
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
          districtId: form.districtId,
          number: Number(form.number),
          name: form.name,
          slug: form.slug || undefined,
          reservedStatus: form.reservedStatus,
        }
      : {
          stateId,
          districtId: form.districtId,
          number: Number(form.number),
          name: form.name,
          slug: form.slug || undefined,
          reservedStatus: form.reservedStatus,
        };
    const res = await fetch(editingId ? `/api/admin/constituencies/${editingId}` : "/api/admin/constituencies", {
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

  async function remove(c: ConstituencyRow) {
    if (!confirm(`Delete constituency "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/constituencies/${c.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not delete constituency.");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="max-w-sm flex-1">
          <StateSelector value={stateId} onChange={handleStateChange} required />
        </div>
        {stateId && (
          <div className="max-w-sm flex-1">
            <DistrictSelector stateId={stateId} value={districtFilter} onChange={setDistrictFilter} label="Filter by district" />
          </div>
        )}
        {stateId && (
          <div className="relative max-w-xs flex-1">
            <label className="mb-1.5 block text-sm font-medium">Search</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 mt-[11px] -translate-y-1/2 text-muted" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search constituencies..."
              aria-label="Search constituencies"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
            />
          </div>
        )}
        {stateId && (
          <Button size="sm" onClick={startCreate}>
            <Plus size={15} /> Add Constituency
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card-surface mt-4 space-y-4 rounded-2xl p-5">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="District" required>
              <DistrictSelector stateId={stateId} value={form.districtId} onChange={(v) => setForm((f) => ({ ...f, districtId: v }))} required />
            </Field>
            <Field label="AC Number" required>
              <TextInput type="number" value={form.number} onChange={(v) => setForm((f) => ({ ...f, number: v }))} required />
            </Field>
            <Field label="Name" required>
              <TextInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
            </Field>
            <Field label="Slug (auto-generated if blank)">
              <TextInput value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} />
            </Field>
            <Field label="Reservation">
              <select
                value={form.reservedStatus}
                onChange={(e) => setForm((f) => ({ ...f, reservedStatus: e.target.value as (typeof RESERVED_STATUSES)[number] }))}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
              >
                {RESERVED_STATUSES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={saving || !form.districtId}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create constituency"}
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
                <th className="p-3">AC#</th>
                <th className="p-3">Name</th>
                <th className="p-3">District</th>
                <th className="p-3">Reservation</th>
                <th className="p-3">Elections</th>
                <th className="p-3">Candidates</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {listError && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-danger">
                    {listError}
                  </td>
                </tr>
              )}
              {!listError && rows === null && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              )}
              {!listError && rows?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted">
                    No constituencies found.
                  </td>
                </tr>
              )}
              {rows?.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="p-3">{c.number}</td>
                  <td className="p-3 font-medium">
                    <Link href={`/admin/candidates?constituencyId=${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{c.district.name}</td>
                  <td className="p-3 text-muted">{c.reservedStatus}</td>
                  <td className="p-3">{c._count.electionConstituencies}</td>
                  <td className="p-3">{c._count.candidates}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => startEdit(c)} className="text-ink hover:opacity-70" aria-label={`Edit ${c.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(c)} className="text-danger hover:opacity-70" aria-label={`Delete ${c.name}`}>
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
