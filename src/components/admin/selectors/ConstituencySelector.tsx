"use client";

import { useAdminList } from "@/lib/useAdminList";
import { AdminSelect } from "./AdminSelect";

interface ConstituencyItem {
  id: string;
  number: number;
  name: string;
}

// Scoped to a state (required) and optionally a district. Never fetches an
// unscoped constituency list.
export function ConstituencySelector({
  stateId,
  districtId,
  value,
  onChange,
  label = "Constituency",
  required,
}: {
  stateId: string;
  districtId?: string;
  value: string;
  onChange: (constituencyId: string) => void;
  label?: string;
  required?: boolean;
}) {
  const url = stateId
    ? `/api/admin/constituencies?stateId=${stateId}${districtId ? `&districtId=${districtId}` : ""}`
    : null;
  const { items, loading, error } = useAdminList<ConstituencyItem>(url);

  return (
    <AdminSelect
      label={label}
      value={value}
      onChange={onChange}
      loading={loading}
      error={error}
      required={required}
      disabled={!stateId}
      placeholder={stateId ? "Select a constituency..." : "Select a state first"}
      emptyMessage="No constituencies found."
      options={items.map((c) => ({ value: c.id, label: `AC #${c.number} · ${c.name}` }))}
    />
  );
}
