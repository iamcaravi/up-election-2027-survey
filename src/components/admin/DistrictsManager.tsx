"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, ErrorBanner } from "./FormField";
import { StateSelector } from "./selectors/StateSelector";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface DistrictRow {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  _count: { constituencies: number };
}

const emptyForm = { name: "", slug: "", code: "" };

export function DistrictsManager() {
  const searchParams = useSearchParams();
  const [stateId, setStateId] = useState(searchParams.get("stateId") ?? "");
  const [query, setQuery] = useState("");
  const [districts, setDistricts] = useState<DistrictRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stateId) {
      setDistricts(null);
      return;
    }
    setListError(null);
    const qs = new URLSearchParams({ stateId, ...(query ? { q: query } : {}) });
    const res = await fetch(`/api/admin/districts?${qs}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load districts.");
      return;
    }
    setDistricts(data);
  }, [stateId, query]);

  useEffect(() => {
    const handle = setTimeout(load, 200);
    return () => clearTimeout(handle);
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function startEdit(d: DistrictRow) {
    setEditingId(d.id);
    setForm({ name: d.name, slug: d.slug, code: d.code ?? "" });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = editingId
      ? { name: form.name, slug: form.slug || undefined, code: form.code || null }
      : { stateId, name: form.name, slug: form.slug || undefined, code: form.code || undefined };
    const res = await fetch(editingId ? `/api/admin/districts/${editingId}` : "/api/admin/districts", {
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

  async function remove(d: DistrictRow) {
    if (!confirm(`Delete district "${d.name}"?`)) return;
    const res = await fetch(`/api/admin/districts/${d.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not delete district.");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="max-w-sm flex-1">
          <StateSelector value={stateId} onChange={setStateId} required />
        </div>
        {stateId && (
          <div className="relative max-w-xs flex-1">
            <label className="mb-1.5 block text-sm font-medium">Search</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 mt-[11px] -translate-y-1/2 text-muted" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search districts..."
              aria-label="Search districts"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
            />
          </div>
        )}
        {stateId && (
          <Button size="sm" onClick={startCreate}>
            <Plus size={15} /> Add District
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="card-surface mt-4 space-y-4 rounded-2xl p-5">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Name" required>
              <TextInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
            </Field>
            <Field label="Slug (auto-generated if blank)">
              <TextInput value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} />
            </Field>
            <Field label="Code (optional)">
              <TextInput value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} />
            </Field>
          </div>
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create district"}
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
                <th className="p-3">Slug</th>
                <th className="p-3">Code</th>
                <th className="p-3">Constituencies</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {listError && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-danger">
                    {listError}
                  </td>
                </tr>
              )}
              {!listError && districts === null && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              )}
              {!listError && districts?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    No districts in this state yet.
                  </td>
                </tr>
              )}
              {districts?.map((d) => (
                <tr key={d.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">
                    <Link href={`/admin/constituencies?stateId=${stateId}&districtId=${d.id}`} className="hover:underline">
                      {d.name}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">{d.slug}</td>
                  <td className="p-3 text-muted">{d.code ?? "—"}</td>
                  <td className="p-3">{d._count.constituencies}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => startEdit(d)} className="text-ink hover:opacity-70" aria-label={`Edit ${d.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(d)} className="text-danger hover:opacity-70" aria-label={`Delete ${d.name}`}>
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
