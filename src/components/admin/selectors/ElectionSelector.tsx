"use client";

import { useAdminList } from "@/lib/useAdminList";
import { AdminSelect } from "./AdminSelect";

interface ElectionItem {
  id: string;
  name: string;
  year: number;
  isActive: boolean;
}

// Scoped to a state — pass stateId="" to render disabled/empty until a
// state is chosen upstream. Never fetches an unscoped election list.
export function ElectionSelector({
  stateId,
  value,
  onChange,
  label = "Election",
  required,
}: {
  stateId: string;
  value: string;
  onChange: (electionId: string) => void;
  label?: string;
  required?: boolean;
}) {
  const { items, loading, error } = useAdminList<ElectionItem>(stateId ? `/api/admin/elections?stateId=${stateId}` : null);

  return (
    <AdminSelect
      label={label}
      value={value}
      onChange={onChange}
      loading={loading}
      error={error}
      required={required}
      disabled={!stateId}
      placeholder={stateId ? "Select an election..." : "Select a state first"}
      emptyMessage="No elections in this state yet."
      options={items.map((e) => ({ value: e.id, label: `${e.name} (${e.year})${e.isActive ? "" : " — disabled"}` }))}
    />
  );
}
