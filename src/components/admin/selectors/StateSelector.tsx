"use client";

import { useAdminList } from "@/lib/useAdminList";
import { AdminSelect } from "./AdminSelect";

interface StateItem {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

// State is always the root scope — it is the only selector in this family
// that fetches an unscoped list.
export function StateSelector({
  value,
  onChange,
  label = "State",
  required,
}: {
  value: string;
  onChange: (stateId: string) => void;
  label?: string;
  required?: boolean;
}) {
  const { items, loading, error } = useAdminList<StateItem>("/api/admin/states");

  return (
    <AdminSelect
      label={label}
      value={value}
      onChange={onChange}
      loading={loading}
      error={error}
      required={required}
      placeholder="Select a state..."
      emptyMessage="No states exist yet — create one first."
      options={items.map((s) => ({ value: s.id, label: `${s.name} (${s.code})${s.isActive ? "" : " — disabled"}` }))}
    />
  );
}
