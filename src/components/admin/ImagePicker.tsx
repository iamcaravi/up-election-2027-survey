"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, ImageOff, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "./FormField";
import type { MediaAssetRow } from "./MediaLibrary";

// Reusable "pick an existing Media Library asset, or upload a new one"
// control — for any future CMS editor that needs an image (SEO OG image
// today; homepage/hero/section images in a later phase). Deliberately does
// NOT touch the existing feature-specific upload routes (Hero background,
// Survey Hero elements) — this is purely additive, a second, independent
// image source.
export function ImagePicker({
  value,
  onChange,
}: {
  /** Selected MediaAsset id, or null for "none selected". */
  value: string | null;
  onChange: (assetId: string | null, asset: MediaAssetRow | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAssetRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MediaAssetRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value) {
      setSelectedAsset(null);
      return;
    }
    fetch(`/api/admin/media/${value}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSelectedAsset)
      .catch(() => setSelectedAsset(null));
  }, [value]);

  function loadAssets(q?: string) {
    fetch(`/api/admin/media${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((r) => r.json())
      .then(setAssets)
      .catch(() => setAssets([]));
  }

  useEffect(() => {
    if (open) loadAssets();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadAssets(search || undefined), 300);
    return () => clearTimeout(t);
  }, [search, open]);

  async function upload(file: File) {
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
    select(data);
  }

  function select(asset: MediaAssetRow) {
    setSelectedAsset(asset);
    onChange(asset.id, asset);
    setOpen(false);
  }

  function clear() {
    setSelectedAsset(null);
    onChange(null, null);
  }

  return (
    <div>
      {selectedAsset ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
            <Image src={selectedAsset.url} alt={selectedAsset.altText ?? ""} fill className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{selectedAsset.fileName}</p>
            <p className="truncate text-[11px] text-muted">{selectedAsset.url}</p>
          </div>
          <button type="button" onClick={clear} className="shrink-0 text-muted hover:text-danger" aria-label="Remove image">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted hover:border-accent hover:text-accent"
        >
          <ImageOff size={16} /> Select or upload an image
        </button>
      )}
      {!selectedAsset && (
        <button type="button" onClick={() => setOpen(true)} className="mt-1.5 text-xs font-semibold text-accent hover:underline">
          Choose from Media Library
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Select an image</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-ink" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <TextInput value={search} onChange={setSearch} placeholder="Search media..." />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) upload(file);
                  e.target.value = "";
                }}
              />
              <Button type="button" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload size={14} /> {uploading ? "Uploading..." : "Upload new"}
              </Button>
            </div>
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {assets === null && <p className="col-span-full text-sm text-muted">Loading...</p>}
              {assets?.length === 0 && <p className="col-span-full text-sm text-muted">No media found.</p>}
              {assets?.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => select(a)}
                  className="relative aspect-square overflow-hidden rounded-lg border border-border hover:border-accent"
                >
                  <Image src={a.url} alt={a.altText ?? ""} fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
