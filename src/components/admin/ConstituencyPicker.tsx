"use client";

import { useEffect, useState } from "react";

interface Item {
  id: string;
  name: string;
  number: number;
  districtName: string;
}

export function ConstituencyPicker({
  value,
  onChange,
}: {
  value: Item | null;
  onChange: (item: Item) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/admin/constituency-search?q=${encodeURIComponent(query)}`);
      if (res.ok) setResults(await res.json());
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative">
      <input
        value={value ? `${value.name} (${value.districtName})` : query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search constituency..."
        className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onChange(r);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-2"
            >
              <span>
                AC #{r.number} · {r.name}
              </span>
              <span className="text-xs text-muted">{r.districtName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
