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

export default function ImportsPage() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ValidateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState(false);

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

  return (
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
  );
}
