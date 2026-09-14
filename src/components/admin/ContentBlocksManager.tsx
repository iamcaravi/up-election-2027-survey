"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, History, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea, ErrorBanner } from "./FormField";

interface ContentBlockRow {
  id: string;
  slotKey: string;
  contentType: string;
  draftValue: unknown;
  publishedValue: unknown;
  status: "DRAFT_ONLY" | "PUBLISHED" | "HAS_DRAFT";
  updatedAt: string;
  updatedBy: string | null;
  publishedAt: string | null;
}

interface VersionRow {
  id: string;
  value: unknown;
  createdAt: string;
  createdBy: string | null;
}

const CONTENT_TYPES = ["plainText", "richText", "structuredSections", "json"] as const;

function valueToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

// Foundation UI for Phase 2a — proves the ContentBlock persistence/
// draft/publish/version architecture end-to-end. Deliberately NOT wired to
// any real public page content yet (no legal-page/homepage migration this
// phase) — a block created here exists only as a standalone, independently
// testable slot until a later phase reads it from a public page.
export function ContentBlocksManager() {
  const [blocks, setBlocks] = useState<ContentBlockRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ slotKey: "", contentType: "plainText" as (typeof CONTENT_TYPES)[number], initialValue: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<ContentBlockRow | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    const res = await fetch("/api/admin/content-blocks");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load content blocks.");
      return;
    }
    setBlocks(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/admin/content-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotKey: createForm.slotKey,
        contentType: createForm.contentType,
        initialValue: createForm.initialValue,
      }),
    });
    const data = await res.json().catch(() => null);
    setCreating(false);
    if (!res.ok) {
      setCreateError(data?.error ?? "Something went wrong.");
      return;
    }
    setShowCreate(false);
    setCreateForm({ slotKey: "", contentType: "plainText", initialValue: "" });
    await load();
  }

  const filtered = (blocks ?? []).filter((b) => !search.trim() || b.slotKey.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xs flex-1">
          <TextInput value={search} onChange={setSearch} placeholder="Search by slot key..." />
        </div>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={15} /> New Content Block
        </Button>
      </div>

      {showCreate && (
        <form onSubmit={submitCreate} className="card-surface mt-4 space-y-4 rounded-2xl p-5">
          <ErrorBanner message={createError} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slot key" required>
              <TextInput
                value={createForm.slotKey}
                onChange={(v) => setCreateForm((f) => ({ ...f, slotKey: v }))}
                required
                placeholder="e.g. legal.privacy"
              />
            </Field>
            <Field label="Content type" required>
              <select
                value={createForm.contentType}
                onChange={(e) => setCreateForm((f) => ({ ...f, contentType: e.target.value as (typeof CONTENT_TYPES)[number] }))}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Initial published value">
            <TextArea value={createForm.initialValue} onChange={(v) => setCreateForm((f) => ({ ...f, initialValue: v }))} rows={4} />
          </Field>
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? "Creating..." : "Create block"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Slot key</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
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
            {!listError && blocks === null && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  Loading...
                </td>
              </tr>
            )}
            {blocks && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  No content blocks yet.
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr key={b.slotKey} className="border-b border-border/60">
                <td className="p-3 font-mono text-xs font-medium text-foreground">{b.slotKey}</td>
                <td className="p-3 text-muted">{b.contentType}</td>
                <td className="p-3">
                  <span
                    className={
                      b.status === "HAS_DRAFT"
                        ? "rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700"
                        : "rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-bold text-positive"
                    }
                  >
                    {b.status === "HAS_DRAFT" ? "Unpublished draft" : "Published"}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted">{new Date(b.updatedAt).toLocaleString()}</td>
                <td className="p-3">
                  <button type="button" onClick={() => setSelected(b)} className="text-xs font-semibold text-accent hover:underline">
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <ContentBlockDetail
          block={selected}
          onClose={() => setSelected(null)}
          onChanged={async () => {
            await load();
            const res = await fetch(`/api/admin/content-blocks/${encodeURIComponent(selected.slotKey)}`);
            if (res.ok) setSelected(await res.json());
          }}
        />
      )}
    </div>
  );
}

function ContentBlockDetail({ block, onClose, onChanged }: { block: ContentBlockRow; onClose: () => void; onChanged: () => void }) {
  const [draftText, setDraftText] = useState(valueToText(block.draftValue ?? block.publishedValue));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setDraftText(valueToText(block.draftValue ?? block.publishedValue));
  }, [block]);

  async function act(action: "save-draft" | "publish" | "discard-draft") {
    setSaving(true);
    setError(null);
    const body = action === "save-draft" ? { action, value: draftText } : { action };
    const res = await fetch(`/api/admin/content-blocks/${encodeURIComponent(block.slotKey)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(data?.error ?? "Something went wrong.");
      return;
    }
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-mono text-sm font-bold text-foreground">{block.slotKey}</h3>
            <p className="text-xs text-muted">{block.contentType}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <ErrorBanner message={error} />

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            {block.status === "HAS_DRAFT" ? "Draft (unpublished)" : "Value"}
          </p>
          <TextArea value={draftText} onChange={setDraftText} rows={8} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => act("save-draft")} disabled={saving}>
            Save Draft
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowPreview((v) => !v)}>
            <Eye size={14} /> Preview Draft
          </Button>
          <Button size="sm" variant="cta" onClick={() => act("publish")} disabled={saving || block.status !== "HAS_DRAFT"}>
            Publish
          </Button>
          {block.status === "HAS_DRAFT" && (
            <Button size="sm" variant="outline" onClick={() => act("discard-draft")} disabled={saving}>
              Discard Draft
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setShowHistory((v) => !v)}>
            <History size={14} /> History
          </Button>
        </div>

        {showPreview && (
          <div className="mt-4 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Draft preview (not live)</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{draftText}</p>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Currently published (live)</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{valueToText(block.publishedValue)}</p>
        </div>

        {showHistory && <VersionHistory slotKey={block.slotKey} onRestored={onChanged} />}
      </div>
    </div>
  );
}

function VersionHistory({ slotKey, onRestored }: { slotKey: string; onRestored: () => void }) {
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/content-blocks/${encodeURIComponent(slotKey)}/versions`)
      .then((r) => r.json())
      .then(setVersions)
      .catch(() => setVersions([]));
  }, [slotKey]);

  async function restore(versionId: string) {
    setRestoring(versionId);
    await fetch(`/api/admin/content-blocks/${encodeURIComponent(slotKey)}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    setRestoring(null);
    onRestored();
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Version history (each was published live at that time)</p>
      {versions === null && <p className="mt-2 text-xs text-muted">Loading...</p>}
      {versions?.length === 0 && <p className="mt-2 text-xs text-muted">No previous versions — this block hasn&apos;t been published over yet.</p>}
      <ul className="mt-2 space-y-2">
        {versions?.map((v) => (
          <li key={v.id} className="rounded-lg border border-border p-2.5">
            <p className="text-[11px] text-muted">
              {new Date(v.createdAt).toLocaleString()} {v.createdBy ? `· ${v.createdBy}` : ""}
            </p>
            <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-foreground">{valueToText(v.value)}</p>
            <button
              type="button"
              onClick={() => restore(v.id)}
              disabled={restoring === v.id}
              className="mt-1.5 text-xs font-semibold text-accent hover:underline disabled:opacity-50"
            >
              {restoring === v.id ? "Restoring to draft..." : "Restore to draft (then Publish to make it live)"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
