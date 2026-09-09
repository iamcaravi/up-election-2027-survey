"use client";

import { cn } from "@/lib/utils";

// Shared presentational <select> for all admin cascading selectors —
// native select elements give keyboard navigation and mobile pickers for
// free, so this deliberately avoids a custom combobox.
export function AdminSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  loading,
  error,
  emptyMessage,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  required?: boolean;
}) {
  const isEmpty = !loading && !error && options.length === 0;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading || isEmpty}
        aria-label={label}
        aria-busy={loading}
        aria-invalid={!!error}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30",
          (disabled || loading || isEmpty) && "cursor-not-allowed opacity-60"
        )}
      >
        <option value="">
          {loading ? "Loading..." : isEmpty ? (emptyMessage ?? "None available") : (placeholder ?? "Select...")}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
