"use client";

import { useAdminList } from "@/lib/useAdminList";
import { AdminSelect } from "./AdminSelect";

interface DistrictItem {
  id: string;
  name: string;
}

// Scoped to a state — never fetches an unscoped district list.
export function DistrictSelector({
  stateId,
  value,
  onChange,
  label = "District",
  required,
}: {
  stateId: string;
  value: string;
  onChange: (districtId: string) => void;
  label?: string;
  required?: boolean;
}) {
  const { items, loading, error } = useAdminList<DistrictItem>(stateId ? `/api/admin/districts?stateId=${stateId}` : null);

  return (
    <AdminSelect
      label={label}
      value={value}
      onChange={onChange}
      loading={loading}
      error={error}
      required={required}
      disabled={!stateId}
      placeholder={stateId ? "Select a district..." : "Select a state first"}
      emptyMessage="No districts in this state yet."
      options={items.map((d) => ({ value: d.id, label: d.name }))}
    />
  );
}
