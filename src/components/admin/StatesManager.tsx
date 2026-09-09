"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, Checkbox, ErrorBanner } from "./FormField";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

interface StateRow {
  id: string;
  name: string;
  slug: string;
  code: string;
  shortName: string | null;
  isActive: boolean;
  _count: { elections: number; districts: number; constituencies: number };
}

const emptyForm = { name: "", slug: "", code: "", shortName: "", isActive: true };

export function StatesManager() {
  const [states, setStates] = useState<StateRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    const res = await fetch(`/api/admin/states${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load states.");
      return;
    }
    setStates(data);
  }, [query]);

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

  function startEdit(s: StateRow) {
    setEditingId(s.id);
    setForm({ name: s.name, slug: s.slug, code: s.code, shortName: s.shortName ?? "", isActive: s.isActive });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      slug: form.slug || undefined,
      code: form.code,
      shortName: form.shortName || undefined,
      isActive: form.isActive,
    };
    const res = await fetch(editingId ? `/api/admin/states/${editingId}` : "/api/admin/states", {
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

  async function remove(s: StateRow) {
    if (!confirm(`Delete state "${s.name}"? This only works if it has no elections, districts or constituencies.`)) return;
    const res = await fetch(`/api/admin/states/${s.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not delete state.");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search states..."
            aria-label="Search states"
            className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
          />
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus size={15} /> Add State
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card-surface mt-4 space-y-4 rounded-2xl p-5">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required>
              <TextInput value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required placeholder="e.g. Maharashtra" />
            </Field>
            <Field label="Code" required>
              <TextInput value={form.code} onChange={(v) => setForm((f) => ({ ...f, code: v }))} required placeholder="e.g. MH" />
            </Field>
            <Field label="Slug (auto-generated from name if left blank)">
              <TextInput value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} placeholder="e.g. maharashtra" />
            </Field>
            <Field label="Short name (optional)">
              <TextInput value={form.shortName} onChange={(v) => setForm((f) => ({ ...f, shortName: v }))} />
            </Field>
          </div>
          <Checkbox checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active (visible on the public site)" />
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create state"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Elections</th>
              <th className="p-3">Districts</th>
              <th className="p-3">Constituencies</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {listError && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-danger">
                  {listError}
                </td>
              </tr>
            )}
            {!listError && states === null && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted">
                  Loading...
                </td>
              </tr>
            )}
            {!listError && states?.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted">
                  No states yet. Add the first one above.
                </td>
              </tr>
            )}
            {states?.map((s) => (
              <tr key={s.id} className="border-b border-border/60">
                <td className="p-3 font-medium">
                  <Link href={`/admin/elections?stateId=${s.id}`} className="hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="p-3 text-muted">{s.code}</td>
                <td className="p-3 text-muted">{s.slug}</td>
                <td className="p-3">{s._count.elections}</td>
                <td className="p-3">{s._count.districts}</td>
                <td className="p-3">{s._count.constituencies}</td>
                <td className="p-3">
                  <span className={s.isActive ? "text-positive" : "text-muted"}>{s.isActive ? "Active" : "Disabled"}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(s)} className="text-ink hover:opacity-70" aria-label={`Edit ${s.name}`}>
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => remove(s)} className="text-danger hover:opacity-70" aria-label={`Delete ${s.name}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
