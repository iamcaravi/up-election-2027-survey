"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextInput, ErrorBanner } from "./FormField";

export interface MediaAssetRow {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  caption: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Full Admin → Media Library page (grid, search, upload, edit, delete).
// The same fetch surface (/api/admin/media) also backs <ImagePicker>, which
// embeds a lighter-weight version of this browse+upload flow inside other
// CMS forms.
export function MediaLibrary() {
  const [assets, setAssets] = useState<MediaAssetRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaAssetRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (q?: string) => {
    setError(null);
    const res = await fetch(`/api/admin/media${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "Failed to load media.");
      return;
    }
    setAssets(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const data = await res.json().catch(() => null);
    setUploading(false);
    if (!res.ok) {
      setError(data?.error ?? "Upload failed.");
      return;
    }
    await load(search || undefined);
  }

  async function remove(asset: MediaAssetRow) {
    if (!confirm(`Delete "${asset.fileName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not delete asset.");
      return;
    }
    setSelected(null);
    await load(search || undefined);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xs flex-1">
          <TextInput value={search} onChange={setSearch} placeholder="Search filename, alt text, caption..." />
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload size={15} /> {uploading ? "Uploading..." : "Upload image"}
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} />

      {assets === null && <p className="mt-6 text-sm text-muted">Loading...</p>}
      {assets?.length === 0 && <p className="mt-6 text-sm text-muted">No media uploaded yet.</p>}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {assets?.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelected(a)}
            className="card-surface overflow-hidden rounded-xl text-left transition-colors hover:border-accent"
          >
            <div className="relative aspect-square w-full bg-surface-2">
              <Image src={a.url} alt={a.altText ?? ""} fill className="object-cover" unoptimized />
            </div>
            <div className="p-2.5">
              <p className="truncate text-xs font-semibold text-foreground">{a.fileName}</p>
              <p className="mt-0.5 text-[11px] text-muted">{formatSize(a.sizeBytes)}</p>
            </div>
          </button>
        ))}
      </div>

      {selected && <MediaDetail asset={selected} onClose={() => setSelected(null)} onDelete={() => remove(selected)} onSaved={() => load(search || undefined)} />}
    </div>
  );
}

function MediaDetail({
  asset,
  onClose,
  onDelete,
  onSaved,
}: {
  asset: MediaAssetRow;
  onClose: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const [altText, setAltText] = useState(asset.altText ?? "");
  const [caption, setCaption] = useState(asset.caption ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/media/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText: altText || null, caption: caption || null }),
    });
    setSaving(false);
    onSaved();
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — the URL is still shown as selectable text below.
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-foreground">{asset.fileName}</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="relative mt-3 h-48 w-full overflow-hidden rounded-xl bg-surface-2">
          <Image src={asset.url} alt={altText} fill className="object-contain" unoptimized />
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
          <div>
            <dt className="font-semibold">Type</dt>
            <dd>{asset.mimeType}</dd>
          </div>
          <div>
            <dt className="font-semibold">Size</dt>
            <dd>{formatSize(asset.sizeBytes)}</dd>
          </div>
          <div>
            <dt className="font-semibold">Uploaded</dt>
            <dd>{new Date(asset.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="font-semibold">By</dt>
            <dd>{asset.uploadedBy ?? "—"}</dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center gap-2">
          <TextInput value={asset.url} onChange={() => {}} />
          <Button type="button" size="sm" variant="ghost" onClick={copyUrl}>
            <Copy size={14} /> {copied ? "Copied" : "Copy URL"}
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Alt text</label>
            <TextInput value={altText} onChange={setAltText} placeholder="Describes the image for accessibility" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Caption</label>
            <TextInput value={caption} onChange={setCaption} placeholder="Optional caption" />
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-danger">
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
