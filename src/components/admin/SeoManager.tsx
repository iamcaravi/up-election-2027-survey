"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea, Checkbox, ErrorBanner } from "./FormField";
import { ImagePicker } from "./ImagePicker";

interface CatalogResponse {
  staticPages: { category: string; label: string; path: string }[];
  stateScopedPages: { category: string; label: string }[];
}

interface StateOption {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface ResolveResponse {
  path: string;
  generatedTitle: string;
  generatedDescription: string;
  override: {
    path: string;
    title: string | null;
    description: string | null;
    ogImageAssetId: string | null;
    noindex: boolean;
    updatedAt: string;
    updatedBy: string | null;
  } | null;
}

interface OverrideListRow {
  path: string;
  title: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

// Per-page SEO overrides — layers on top of buildPageMetadata() (see
// src/lib/seo-overrides.ts's applySeoOverride). The path an override applies
// to is ALWAYS server-resolved from a real category (+ state, for the
// state-scoped categories) via /api/admin/seo/resolve — this UI never lets
// an admin type an arbitrary path, which is what prevents an invalid/
// non-existent canonical override.
export function SeoManager() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [states, setStates] = useState<StateOption[]>([]);
  const [category, setCategory] = useState("");
  const [stateSlug, setStateSlug] = useState("");
  const [resolved, setResolved] = useState<ResolveResponse | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", ogImageAssetId: null as string | null, noindex: false });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<OverrideListRow[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/seo/catalog")
      .then((r) => r.json())
      .then(setCatalog);
    fetch("/api/admin/states")
      .then((r) => r.json())
      .then(setStates)
      .catch(() => setStates([]));
    loadOverrides();
  }, []);

  function loadOverrides() {
    fetch("/api/admin/seo")
      .then((r) => r.json())
      .then(setOverrides)
      .catch(() => setOverrides([]));
  }

  const isStateScoped = catalog?.stateScopedPages.some((p) => p.category === category) ?? false;

  const resolve = useCallback(async () => {
    if (!category) {
      setResolved(null);
      return;
    }
    if (isStateScoped && !stateSlug) {
      setResolved(null);
      return;
    }
    setResolveError(null);
    const params = new URLSearchParams({ category });
    if (isStateScoped) params.set("stateSlug", stateSlug);
    const res = await fetch(`/api/admin/seo/resolve?${params}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setResolveError(data?.error ?? "Could not resolve this page.");
      setResolved(null);
      return;
    }
    setResolved(data);
    setForm({
      title: data.override?.title ?? "",
      description: data.override?.description ?? "",
      ogImageAssetId: data.override?.ogImageAssetId ?? null,
      noindex: data.override?.noindex ?? false,
    });
  }, [category, isStateScoped, stateSlug]);

  useEffect(() => {
    resolve();
  }, [resolve]);

  async function save() {
    if (!resolved) return;
    setSaving(true);
    setSaveError(null);
    const res = await fetch("/api/admin/seo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: resolved.path,
        title: form.title || null,
        description: form.description || null,
        ogImageAssetId: form.ogImageAssetId,
        noindex: form.noindex,
      }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setSaveError(data?.error ?? "Something went wrong.");
      return;
    }
    setResolved((r) => (r ? { ...r, override: data } : r));
    loadOverrides();
  }

  async function reset() {
    if (!resolved) return;
    if (!confirm(`Reset SEO for ${resolved.path} back to the generated default?`)) return;
    await fetch(`/api/admin/seo?path=${encodeURIComponent(resolved.path)}`, { method: "DELETE" });
    setForm({ title: "", description: "", ogImageAssetId: null, noindex: false });
    setResolved((r) => (r ? { ...r, override: null } : r));
    loadOverrides();
  }

  const hasOverride = !!resolved?.override;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card-surface rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Page" required>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setStateSlug("");
              }}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
            >
              <option value="">Select a page...</option>
              {catalog?.staticPages.map((p) => (
                <option key={p.category} value={p.category}>
                  {p.label}
                </option>
              ))}
              {catalog?.stateScopedPages.map((p) => (
                <option key={p.category} value={p.category}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          {isStateScoped && (
            <Field label="State" required>
              <select
                value={stateSlug}
                onChange={(e) => setStateSlug(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
              >
                <option value="">Select a state...</option>
                {states.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                    {!s.isActive ? " — disabled" : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {resolveError && <p className="mt-4 text-sm text-danger">{resolveError}</p>}

        {resolved && (
          <>
            <div className="mt-5 rounded-xl border border-border bg-surface-2 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Route</p>
              <p className="mt-0.5 font-mono text-sm text-foreground">{resolved.path}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Generated Default</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{resolved.generatedTitle}</p>
              <p className="mt-0.5 text-xs text-muted">{resolved.generatedDescription}</p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">Custom Override</p>
                {hasOverride && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">Active</span>}
              </div>
              <Field label="Override title (leave blank to use the generated default)">
                <TextInput value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder={resolved.generatedTitle} />
              </Field>
              <Field label="Override description">
                <TextArea value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} rows={3} />
              </Field>
              <Field label="OG image">
                <ImagePicker value={form.ogImageAssetId} onChange={(id) => setForm((f) => ({ ...f, ogImageAssetId: id }))} />
              </Field>
              <Checkbox checked={form.noindex} onChange={(v) => setForm((f) => ({ ...f, noindex: v }))} label="Noindex this page (hide from search engines)" />

              <ErrorBanner message={saveError} />
              <div className="flex gap-3">
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? "Saving..." : "Save override"}
                </Button>
                {hasOverride && (
                  <Button size="sm" variant="ghost" onClick={reset}>
                    <RotateCcw size={14} /> Reset to default
                  </Button>
                )}
              </div>
              {resolved.override?.updatedAt && (
                <p className="text-xs text-muted">
                  Last updated {new Date(resolved.override.updatedAt).toLocaleString()} {resolved.override.updatedBy ? `by ${resolved.override.updatedBy}` : ""}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card-surface h-fit rounded-2xl p-5">
        <h3 className="font-display text-sm font-bold text-foreground">Existing overrides</h3>
        <ul className="mt-3 space-y-2">
          {overrides?.length === 0 && <li className="text-xs text-muted">None yet — every page uses its generated default.</li>}
          {overrides?.map((o) => (
            <li key={o.path} className="rounded-lg border border-border p-2.5">
              <p className="truncate font-mono text-xs text-foreground">{o.path}</p>
              {o.title && <p className="mt-0.5 truncate text-xs text-muted">{o.title}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
