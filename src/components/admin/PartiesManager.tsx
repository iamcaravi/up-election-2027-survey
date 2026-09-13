"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, Checkbox, ErrorBanner } from "./FormField";
import { StateSelector } from "./selectors/StateSelector";

interface PartyRow {
  id: string;
  nameEnglish: string;
  nameHindi: string | null;
  shortName: string;
  slug: string;
  colorHex: string;
  logoUrl: string | null;
  isActive: boolean;
}

const emptyForm = { nameEnglish: "", nameHindi: "", shortName: "", slug: "", colorHex: "#6b7280", logoUrl: "", isActive: true };

export function PartiesManager() {
  const [parties, setParties] = useState<PartyRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    const res = await fetch("/api/admin/parties");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load parties.");
      return;
    }
    setParties(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function startEdit(p: PartyRow) {
    setEditingId(p.id);
    setForm({
      nameEnglish: p.nameEnglish,
      nameHindi: p.nameHindi ?? "",
      shortName: p.shortName,
      slug: p.slug,
      colorHex: p.colorHex,
      logoUrl: p.logoUrl ?? "",
      isActive: p.isActive,
    });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      nameEnglish: form.nameEnglish,
      nameHindi: form.nameHindi || undefined,
      shortName: form.shortName,
      slug: form.slug || undefined,
      colorHex: form.colorHex,
      logoUrl: form.logoUrl || undefined,
      isActive: form.isActive,
    };
    const res = await fetch(editingId ? `/api/admin/parties/${editingId}` : "/api/admin/parties", {
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

  async function deactivate(p: PartyRow) {
    if (!confirm(`Deactivate "${p.nameEnglish}"? It will drop out of every state's featured list and stop appearing in new surveys.`)) return;
    const res = await fetch(`/api/admin/parties/${p.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not deactivate party.");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          The full party catalog. A party only appears in a state&apos;s public survey once it&apos;s featured for that state below.
        </p>
        <Button size="sm" onClick={startCreate}>
          <Plus size={15} /> Add Party
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card-surface mt-4 space-y-4 rounded-2xl p-5">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)" required>
              <TextInput value={form.nameEnglish} onChange={(v) => setForm((f) => ({ ...f, nameEnglish: v }))} required placeholder="e.g. Aam Aadmi Party" />
            </Field>
            <Field label="Name (Hindi)">
              <TextInput value={form.nameHindi} onChange={(v) => setForm((f) => ({ ...f, nameHindi: v }))} placeholder="e.g. आम आदमी पार्टी" />
            </Field>
            <Field label="Short name" required>
              <TextInput value={form.shortName} onChange={(v) => setForm((f) => ({ ...f, shortName: v }))} required placeholder="e.g. AAP" />
            </Field>
            <Field label="Slug (auto-generated from short name if left blank)">
              <TextInput value={form.slug} onChange={(v) => setForm((f) => ({ ...f, slug: v }))} placeholder="e.g. aap" />
            </Field>
            <Field label="Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.colorHex) ? form.colorHex : "#6b7280"}
                  onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))}
                  className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-border bg-surface"
                  aria-label="Party color"
                />
                <TextInput value={form.colorHex} onChange={(v) => setForm((f) => ({ ...f, colorHex: v }))} placeholder="#6b7280" />
              </div>
            </Field>
            <Field label="Logo path (leave blank if no asset exists yet)">
              <TextInput value={form.logoUrl} onChange={(v) => setForm((f) => ({ ...f, logoUrl: v }))} placeholder="/images/parties/AAP.png" />
            </Field>
          </div>
          <Checkbox checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active" />
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Create party"}
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
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Party</th>
              <th className="p-3">Hindi Name</th>
              <th className="p-3">Short Name</th>
              <th className="p-3">Color</th>
              <th className="p-3">Logo</th>
              <th className="p-3">Status</th>
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
            {!listError && parties === null && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted">
                  Loading...
                </td>
              </tr>
            )}
            {parties?.map((p) => (
              <tr key={p.id} className="border-b border-border/60">
                <td className="p-3 font-medium text-foreground">{p.nameEnglish}</td>
                <td className="p-3 text-muted">{p.nameHindi ?? "—"}</td>
                <td className="p-3 text-muted">{p.shortName}</td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border border-border" style={{ background: p.colorHex }} />
                    <span className="text-xs text-muted">{p.colorHex}</span>
                  </span>
                </td>
                <td className="p-3 text-xs text-muted">{p.logoUrl ? "✓" : "— (fallback)"}</td>
                <td className="p-3">
                  <span
                    className={
                      p.isActive
                        ? "rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-bold text-positive"
                        : "rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted"
                    }
                  >
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <button onClick={() => startEdit(p)} className="text-ink hover:opacity-70" aria-label={`Edit ${p.nameEnglish}`}>
                      <Pencil size={15} />
                    </button>
                    {p.isActive && (
                      <button onClick={() => deactivate(p)} className="text-danger hover:opacity-70" aria-label={`Deactivate ${p.nameEnglish}`}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-ink">Featured Parties by State</h2>
        <p className="mt-1 text-sm text-muted">
          Choose which parties appear in a state&apos;s public survey (max 5) — every state also always gets Other, NOTA and
          Undecided automatically.
        </p>
        <div className="mt-4">
          <FeaturedPartiesPanel allParties={parties ?? []} onChanged={load} />
        </div>
      </div>
    </div>
  );
}

interface FeaturedPartyRow extends PartyRow {
  isFeatured: boolean;
  displayOrderInState: number | null;
}

function FeaturedPartiesPanel({ onChanged }: { allParties: PartyRow[]; onChanged: () => void }) {
  const [stateId, setStateId] = useState("");
  const [maxFeatured, setMaxFeatured] = useState(5);
  const [rows, setRows] = useState<FeaturedPartyRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (id: string) => {
    if (!id) {
      setRows(null);
      return;
    }
    setLoadError(null);
    const res = await fetch(`/api/admin/states/${id}/parties`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setLoadError(data?.error ?? "Failed to load this state's parties.");
      return;
    }
    setMaxFeatured(data.maxFeatured);
    setRows(data.parties);
  }, []);

  useEffect(() => {
    load(stateId);
  }, [stateId, load]);

  const featuredCount = rows?.filter((r) => r.isFeatured).length ?? 0;

  function toggle(partyId: string) {
    setRows((current) => {
      if (!current) return current;
      const target = current.find((r) => r.id === partyId);
      if (!target) return current;
      if (!target.isFeatured && featuredCount >= maxFeatured) return current;
      return current.map((r) => (r.id === partyId ? { ...r, isFeatured: !r.isFeatured } : r));
    });
  }

  async function save() {
    if (!rows) return;
    setSaving(true);
    setSaveError(null);
    const featured = rows.filter((r) => r.isFeatured).map((r) => ({ partyId: r.id }));
    const res = await fetch(`/api/admin/states/${stateId}/parties`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setSaveError(data?.error ?? "Could not save the featured party list.");
      return;
    }
    onChanged();
    await load(stateId);
  }

  return (
    <div className="card-surface rounded-2xl p-5">
      <div className="max-w-xs">
        <StateSelector value={stateId} onChange={setStateId} />
      </div>

      {!stateId && <p className="mt-4 text-sm text-muted">Select a state to manage its featured parties.</p>}
      {stateId && loadError && <p className="mt-4 text-sm text-danger">{loadError}</p>}
      {stateId && !loadError && rows === null && <p className="mt-4 text-sm text-muted">Loading...</p>}

      {stateId && rows && (
        <>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">
            {featuredCount} / {maxFeatured} featured
          </p>
          <ul className="mt-2 divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 shrink-0 rounded-full border border-border" style={{ background: r.colorHex }} />
                  <span className="text-sm font-medium text-foreground">
                    {r.nameEnglish} <span className="text-muted">({r.shortName})</span>
                  </span>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={r.isFeatured}
                    disabled={!r.isFeatured && featuredCount >= maxFeatured}
                    onChange={() => toggle(r.id)}
                    className="h-4 w-4 rounded border-border accent-[var(--ink)]"
                  />
                  Featured
                </label>
              </li>
            ))}
            {rows.length === 0 && <li className="py-6 text-center text-sm text-muted">No active parties — add one above first.</li>}
          </ul>
          <ErrorBanner message={saveError} />
          <Button size="sm" className="mt-4" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save featured parties"}
          </Button>
        </>
      )}
    </div>
  );
}
