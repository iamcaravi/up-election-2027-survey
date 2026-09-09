"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface RowResult {
  row: number;
  data: Record<string, string>;
  errors: string[];
}
interface ValidateResponse {
  totalRows: number;
  validRows: number;
  errorRows: number;
  imported: boolean;
  results: RowResult[];
}

const TEMPLATE_HEADER =
  "state_slug,district,constituency_number,constituency_name,candidate_name,party,candidate_status,confidence_score,photo_url,photo_source_url,photo_source_name,photo_license,source_notes,source_urls";

interface MlaRowResult {
  row: number;
  status: "create" | "update" | "unchanged" | "needs_review";
  constituencyNumber: number | null;
  constituencyName: string | null;
  mlaName: string | null;
  errors: string[];
  changes?: Record<string, { from: unknown; to: unknown }>;
}
interface MlaImportResponse {
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  unchanged: number;
  needsReview: number;
  committed: boolean;
  results: MlaRowResult[];
}

const MLA_TEMPLATE_HEADER =
  "state_slug,constituency_number,constituency_name,mla_name,mla_name_hindi,party_short_name,source_name,source_url";

const MLA_STATUS_LABEL: Record<MlaRowResult["status"], string> = {
  create: "Will create (INCUMBENT)",
  update: "Will update",
  unchanged: "Already up to date",
  needs_review: "Needs review",
};
const MLA_STATUS_CLASS: Record<MlaRowResult["status"], string> = {
  create: "text-positive",
  update: "text-accent",
  unchanged: "text-muted",
  needs_review: "text-danger",
};

export default function ImportsPage() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

  const [mlaCsv, setMlaCsv] = useState("");
  const [mlaPreview, setMlaPreview] = useState<MlaImportResponse | null>(null);
  const [mlaLoading, setMlaLoading] = useState(false);
  const [mlaImported, setMlaImported] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setPreview(null);
    setImported(false);
  }

  async function validate() {
    setLoading(true);
    const res = await fetch("/api/admin/imports/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, commit: false }),
    });
    setPreview(await res.json());
    setLoading(false);
  }

  async function commit() {
    setLoading(true);
    const res = await fetch("/api/admin/imports/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, commit: true }),
    });
    const data = await res.json();
    setPreview(data);
    setImported(true);
    setLoading(false);
  }

  async function handleMlaFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMlaCsv(text);
    setMlaPreview(null);
    setMlaImported(false);
  }

  async function validateMla() {
    setMlaLoading(true);
    const res = await fetch("/api/admin/imports/mlas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: mlaCsv, commit: false }),
    });
    setMlaPreview(await res.json());
    setMlaLoading(false);
  }

  async function commitMla() {
    setMlaLoading(true);
    const res = await fetch("/api/admin/imports/mlas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: mlaCsv, commit: true }),
    });
    const data = await res.json();
    setMlaPreview(data);
    setMlaImported(true);
    setMlaLoading(false);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Imports</h1>
        <p className="mt-1 text-sm text-muted">Bulk-import candidates from a CSV file. Nothing is imported silently — malformed rows are always shown before you confirm.</p>

        <div className="mt-6 card-surface rounded-2xl p-6">
          <p className="mb-2 text-sm font-semibold">Expected columns</p>
          <code className="block overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">{TEMPLATE_HEADER}</code>
          <p className="mt-2 text-xs text-muted">
            <code className="font-semibold">state_slug</code> is required on every row (e.g. <code>uttar-pradesh</code>) —
            it is never assumed, since constituency numbers are only unique within a state.
          </p>

          <div className="mt-5">
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
          </div>

          {csv && !preview && (
            <Button variant="primary" className="mt-4" onClick={validate} disabled={loading}>
              {loading ? "Validating..." : "Validate & Preview"}
            </Button>
          )}
        </div>

        {preview && (
          <div className="mt-6 card-surface rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm">
                <strong>{preview.totalRows}</strong> rows · <strong className="text-positive">{preview.validRows}</strong> valid ·{" "}
                <strong className="text-danger">{preview.errorRows}</strong> with errors
              </p>
              {!imported && preview.errorRows < preview.totalRows && (
                <Button variant="primary" size="sm" onClick={commit} disabled={loading}>
                  {loading ? "Importing..." : `Confirm Import (${preview.validRows} rows)`}
                </Button>
              )}
              {imported && <span className="text-sm font-semibold text-positive">Import complete.</span>}
            </div>

            <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border">
                    <th className="p-2">Row</th>
                    <th className="p-2">Candidate</th>
                    <th className="p-2">AC#</th>
                    <th className="p-2">Party</th>
                    <th className="p-2">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.results.map((r) => (
                    <tr key={r.row} className={cn("border-b border-border/60", r.errors.length > 0 && "bg-danger/5")}>
                      <td className="p-2">{r.row}</td>
                      <td className="p-2">{r.data.candidate_name}</td>
                      <td className="p-2">{r.data.constituency_number}</td>
                      <td className="p-2">{r.data.party}</td>
                      <td className="p-2 text-danger">{r.errors.join("; ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-10">
        <h2 className="font-display text-xl font-extrabold">Import Current MLAs</h2>
        <p className="mt-1 text-sm text-muted">
          Dedicated importer for the current sitting MLA of each constituency. Every imported record is set to{" "}
          <strong>status = INCUMBENT</strong> — this never means they are a declared 2027 candidate, and imported
          records never appear as a live survey option. Source name/URL are required on every row. Re-running this
          import updates the existing record for a seat rather than creating a duplicate.
        </p>

        <div className="mt-6 card-surface rounded-2xl p-6">
          <p className="mb-2 text-sm font-semibold">Expected columns</p>
          <code className="block overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs">{MLA_TEMPLATE_HEADER}</code>
          <p className="mt-2 text-xs text-muted">
            <code className="font-semibold">mla_name_hindi</code> is optional but recommended — never machine-generated,
            enter only a value you can confirm. <code className="font-semibold">source_name</code> and{" "}
            <code className="font-semibold">source_url</code> are required on every row.
          </p>

          <div className="mt-5">
            <input type="file" accept=".csv,text/csv" onChange={handleMlaFile} className="text-sm" />
          </div>

          {mlaCsv && !mlaPreview && (
            <Button variant="primary" className="mt-4" onClick={validateMla} disabled={mlaLoading}>
              {mlaLoading ? "Validating..." : "Validate & Preview"}
            </Button>
          )}
        </div>

        {mlaPreview && (
          <div className="mt-6 card-surface rounded-2xl p-6">
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-sm">
                <strong>{mlaPreview.totalRows}</strong> rows · <strong className="text-positive">{mlaPreview.toCreate}</strong> to
                create · <strong className="text-accent">{mlaPreview.toUpdate}</strong> to update ·{" "}
                <strong className="text-muted">{mlaPreview.unchanged}</strong> unchanged ·{" "}
                <strong className="text-danger">{mlaPreview.needsReview}</strong> need review
              </p>
              {!mlaImported && mlaPreview.toCreate + mlaPreview.toUpdate > 0 && (
                <Button variant="primary" size="sm" onClick={commitMla} disabled={mlaLoading}>
                  {mlaLoading ? "Importing..." : `Confirm Import (${mlaPreview.toCreate + mlaPreview.toUpdate} rows)`}
                </Button>
              )}
              {mlaImported && <span className="text-sm font-semibold text-positive">Import complete.</span>}
            </div>

            <div className="mt-4 max-h-96 overflow-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border">
                    <th className="p-2">Row</th>
                    <th className="p-2">MLA</th>
                    <th className="p-2">AC#</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {mlaPreview.results.map((r) => (
                    <tr key={r.row} className={cn("border-b border-border/60", r.status === "needs_review" && "bg-danger/5")}>
                      <td className="p-2">{r.row}</td>
                      <td className="p-2">{r.mlaName ?? "—"}</td>
                      <td className="p-2">{r.constituencyNumber ?? "—"}</td>
                      <td className={cn("p-2 font-medium", MLA_STATUS_CLASS[r.status])}>{MLA_STATUS_LABEL[r.status]}</td>
                      <td className="p-2 text-muted">
                        {r.errors.length > 0
                          ? <span className="text-danger">{r.errors.join("; ")}</span>
                          : r.changes
                            ? Object.entries(r.changes).map(([field, c]) => `${field}: "${c.from ?? "—"}" → "${c.to ?? "—"}"`).join("; ")
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
