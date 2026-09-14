"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, ErrorBanner } from "./FormField";

const SOCIAL_PLATFORMS = [
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/yourpage" },
] as const;

interface BrandingData {
  siteName: string;
  tagline: string;
  contactEmail: string;
  socialLinks: Partial<Record<(typeof SOCIAL_PLATFORMS)[number]["key"], string>>;
}

export function BrandingForm() {
  const [data, setData] = useState<BrandingData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-branding")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load branding settings."));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/site-branding", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(result?.error ?? "Something went wrong.");
      return;
    }
    setData(result);
    setSaved(true);
  }

  if (!data) return <p className="text-sm text-muted">{error ?? "Loading..."}</p>;

  return (
    <form onSubmit={submit} className="card-surface max-w-xl space-y-5 rounded-2xl p-5">
      <ErrorBanner message={error} />
      {saved && <p className="rounded-lg bg-positive/10 p-3 text-sm text-positive">Saved. The website reflects these changes immediately.</p>}

      <Field label="Site name" required>
        <TextInput value={data.siteName} onChange={(v) => setData((d) => d && { ...d, siteName: v })} required />
      </Field>
      <Field label="Tagline">
        <TextInput value={data.tagline} onChange={(v) => setData((d) => d && { ...d, tagline: v })} />
      </Field>
      <Field label="Contact email" required>
        <TextInput type="email" value={data.contactEmail} onChange={(v) => setData((d) => d && { ...d, contactEmail: v })} required />
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium">Social links</p>
        <div className="space-y-3">
          {SOCIAL_PLATFORMS.map((p) => (
            <Field key={p.key} label={p.label}>
              <TextInput
                value={data.socialLinks[p.key] ?? ""}
                onChange={(v) => setData((d) => d && { ...d, socialLinks: { ...d.socialLinks, [p.key]: v } })}
                placeholder={p.placeholder}
              />
            </Field>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Leave a field blank to show that icon as disabled in the footer instead of a dead link.</p>
      </div>

      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Saving..." : "Save branding"}
      </Button>
    </form>
  );
}
