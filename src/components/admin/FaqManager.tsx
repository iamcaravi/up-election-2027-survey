"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, History, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, TextArea, Checkbox, ErrorBanner } from "./FormField";

interface FaqRow {
  id: string;
  category: string;
  categoryLabel: string;
  question: string;
  answer: string;
  categoryLabelHi: string | null;
  questionHi: string | null;
  answerHi: string | null;
  displayOrder: number;
  published: boolean;
  updatedAt: string;
  updatedBy: string | null;
}

interface FaqVersion {
  id: string;
  category: string;
  question: string;
  answer: string;
  questionHi: string | null;
  answerHi: string | null;
  createdAt: string;
  createdBy: string | null;
}

const emptyForm = {
  category: "",
  categoryLabel: "",
  question: "",
  answer: "",
  categoryLabelHi: "",
  questionHi: "",
  answerHi: "",
  published: true,
};

export function FaqManager() {
  const [items, setItems] = useState<FaqRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<FaqRow | null>(null);

  const load = useCallback(async () => {
    setListError(null);
    const res = await fetch("/api/admin/faq");
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load FAQ items.");
      return;
    }
    setItems(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = Array.from(new Set((items ?? []).map((i) => i.category))).sort();

  function startCreate(category?: string) {
    setEditingId(null);
    const existing = category ? items?.find((i) => i.category === category) : undefined;
    setForm({ ...emptyForm, category: category ?? "", categoryLabel: existing?.categoryLabel ?? "" });
    setError(null);
    setShowForm(true);
  }

  function startEdit(item: FaqRow) {
    setEditingId(item.id);
    setForm({
      category: item.category,
      categoryLabel: item.categoryLabel,
      question: item.question,
      answer: item.answer,
      categoryLabelHi: item.categoryLabelHi ?? "",
      questionHi: item.questionHi ?? "",
      answerHi: item.answerHi ?? "",
      published: item.published,
    });
    setError(null);
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(editingId ? `/api/admin/faq/${editingId}` : "/api/admin/faq", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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

  async function togglePublished(item: FaqRow) {
    await fetch(`/api/admin/faq/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !item.published }),
    });
    await load();
  }

  async function remove(item: FaqRow) {
    if (!confirm(`Delete "${item.question}"? This can be undone from History if needed.`)) return;
    const res = await fetch(`/api/admin/faq/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not delete FAQ item.");
      return;
    }
    await load();
  }

  async function move(item: FaqRow, direction: -1 | 1) {
    const siblings = (items ?? []).filter((i) => i.category === item.category).sort((a, b) => a.displayOrder - b.displayOrder);
    const index = siblings.findIndex((i) => i.id === item.id);
    const swapWith = siblings[index + direction];
    if (!swapWith) return;
    await Promise.all([
      fetch(`/api/admin/faq/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: swapWith.displayOrder }),
      }),
      fetch(`/api/admin/faq/${swapWith.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: item.displayOrder }),
      }),
    ]);
    await load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Manages the questions shown on the public <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">/faq</code> page.
          Unpublished items stay hidden from visitors but remain visible here.
        </p>
        <Button size="sm" onClick={() => startCreate()}>
          <Plus size={15} /> Add Question
        </Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card-surface mt-4 space-y-4 rounded-2xl p-5">
          <ErrorBanner message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category ID" required>
              <TextInput value={form.category} onChange={(v) => setForm((f) => ({ ...f, category: v }))} required placeholder="e.g. general" />
            </Field>
            <Field label="Category label" required>
              <TextInput value={form.categoryLabel} onChange={(v) => setForm((f) => ({ ...f, categoryLabel: v }))} required placeholder="e.g. General" />
            </Field>
          </div>
          <Field label="Question (English)" required>
            <TextInput value={form.question} onChange={(v) => setForm((f) => ({ ...f, question: v }))} required placeholder="What is VoterSurvey.in?" />
          </Field>
          <Field label="Answer (English)" required>
            <TextArea value={form.answer} onChange={(v) => setForm((f) => ({ ...f, answer: v }))} rows={4} />
          </Field>

          <div className="rounded-xl border border-dashed border-border p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Hindi (optional — shown to Hindi-locale visitors; falls back to the English text above when left blank)
            </p>
            <Field label="Category label (Hindi)">
              <TextInput value={form.categoryLabelHi} onChange={(v) => setForm((f) => ({ ...f, categoryLabelHi: v }))} placeholder="e.g. सामान्य" />
            </Field>
            <Field label="Question (Hindi)">
              <TextInput value={form.questionHi} onChange={(v) => setForm((f) => ({ ...f, questionHi: v }))} placeholder="VoterSurvey.in क्या है?" />
            </Field>
            <Field label="Answer (Hindi)">
              <TextArea value={form.answerHi} onChange={(v) => setForm((f) => ({ ...f, answerHi: v }))} rows={4} />
            </Field>
          </div>

          <Checkbox checked={form.published} onChange={(v) => setForm((f) => ({ ...f, published: v }))} label="Published (visible on the public FAQ page)" />
          <div className="flex gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save changes" : "Add question"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {listError && <p className="mt-6 text-sm text-danger">{listError}</p>}
      {!listError && items === null && <p className="mt-6 text-sm text-muted">Loading...</p>}

      {items && categories.length === 0 && <p className="mt-6 text-sm text-muted">No FAQ items yet — add one above.</p>}

      {items &&
        categories.map((category) => {
          const rows = items.filter((i) => i.category === category).sort((a, b) => a.displayOrder - b.displayOrder);
          return (
            <div key={category} className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">{rows[0]?.categoryLabel ?? category}</h2>
                <button type="button" onClick={() => startCreate(category)} className="text-xs font-semibold text-accent hover:underline">
                  + Add to this category
                </button>
              </div>
              <div className="mt-2 card-surface divide-y divide-border overflow-hidden rounded-2xl">
                {rows.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-3 p-4">
                    <div className="flex shrink-0 flex-col gap-0.5 pt-0.5">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => move(item, -1)}
                        className="text-muted hover:text-ink disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={i === rows.length - 1}
                        onClick={() => move(item, 1)}
                        className="text-muted hover:text-ink disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-sm font-bold text-foreground">{item.question}</p>
                        <span
                          className={
                            item.published
                              ? "rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-bold text-positive"
                              : "rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted"
                          }
                        >
                          {item.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{item.answer}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 pt-0.5">
                      <button type="button" onClick={() => setHistoryFor(item)} className="text-muted hover:text-ink" aria-label="View history">
                        <History size={15} />
                      </button>
                      <button type="button" onClick={() => togglePublished(item)} className="text-xs font-semibold text-accent hover:underline">
                        {item.published ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" onClick={() => startEdit(item)} className="text-ink hover:opacity-70" aria-label={`Edit ${item.question}`}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => remove(item)} className="text-danger hover:opacity-70" aria-label={`Delete ${item.question}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {historyFor && <FaqHistoryPanel item={historyFor} onClose={() => setHistoryFor(null)} onRestored={load} />}
    </div>
  );
}

function FaqHistoryPanel({ item, onClose, onRestored }: { item: FaqRow; onClose: () => void; onRestored: () => void }) {
  const [versions, setVersions] = useState<FaqVersion[] | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/faq/${item.id}/versions`)
      .then((r) => r.json())
      .then(setVersions)
      .catch(() => setVersions([]));
  }, [item.id]);

  async function restore(versionId: string) {
    if (!confirm("Restore this version? The current content will be saved to history first.")) return;
    setRestoring(versionId);
    await fetch(`/api/admin/faq/${item.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    setRestoring(null);
    onRestored();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-foreground">History — {item.question}</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {versions === null && <p className="mt-4 text-sm text-muted">Loading...</p>}
        {versions?.length === 0 && <p className="mt-4 text-sm text-muted">No previous versions — this item hasn&apos;t been edited yet.</p>}
        <ul className="mt-4 space-y-3">
          {versions?.map((v) => (
            <li key={v.id} className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted">
                {new Date(v.createdAt).toLocaleString()} {v.createdBy ? `· ${v.createdBy}` : ""}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">{v.question}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{v.answer}</p>
              <button
                type="button"
                onClick={() => restore(v.id)}
                disabled={restoring === v.id}
                className="mt-2 text-xs font-semibold text-accent hover:underline disabled:opacity-50"
              >
                {restoring === v.id ? "Restoring..." : "Restore this version"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
