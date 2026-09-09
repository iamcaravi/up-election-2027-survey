"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "./FormField";
import { StateSelector } from "./selectors/StateSelector";
import { ElectionSelector } from "./selectors/ElectionSelector";
import { DistrictSelector } from "./selectors/DistrictSelector";
import { ConstituencySelector } from "./selectors/ConstituencySelector";
import { Plus, Trash2, Power } from "lucide-react";

interface MappingRow {
  id: string;
  isActive: boolean;
  constituency: { id: string; number: number; name: string; district: { name: string } };
}

export function ElectionConstituenciesManager() {
  const searchParams = useSearchParams();
  const [stateId, setStateId] = useState(searchParams.get("stateId") ?? "");
  const [electionId, setElectionId] = useState(searchParams.get("electionId") ?? "");

  // Independent State -> District -> Constituency chain for adding a new
  // mapping, kept separate from the scope selector above so picking a
  // constituency to add never disturbs which election's mappings are shown.
  const [addDistrictId, setAddDistrictId] = useState("");
  const [addConstituencyId, setAddConstituencyId] = useState("");

  const [mappings, setMappings] = useState<MappingRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!electionId) {
      setMappings(null);
      return;
    }
    setListError(null);
    const res = await fetch(`/api/admin/election-constituencies?electionId=${electionId}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load mappings.");
      return;
    }
    setMappings(data);
  }, [electionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Changing state clears the dependent election, and both add-selectors.
  function handleStateChange(id: string) {
    setStateId(id);
    setElectionId("");
    setAddDistrictId("");
    setAddConstituencyId("");
  }

  function handleElectionChange(id: string) {
    setElectionId(id);
    setAddDistrictId("");
    setAddConstituencyId("");
  }

  function handleAddDistrictChange(id: string) {
    setAddDistrictId(id);
    setAddConstituencyId("");
  }

  async function addMapping() {
    if (!electionId || !addConstituencyId) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch("/api/admin/election-constituencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ electionId, constituencyId: addConstituencyId }),
    });
    const data = await res.json().catch(() => null);
    setAdding(false);
    if (!res.ok) {
      setAddError(data?.error ?? "Could not add mapping.");
      return;
    }
    setAddConstituencyId("");
    await load();
  }

  async function toggleActive(m: MappingRow) {
    const res = await fetch(`/api/admin/election-constituencies/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not update mapping.");
      return;
    }
    await load();
  }

  async function removeMapping(m: MappingRow) {
    if (!confirm(`Remove ${m.constituency.name} from this election? This only works if it has no candidates or surveys yet.`)) return;
    const res = await fetch(`/api/admin/election-constituencies/${m.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      alert(data?.error ?? "Could not remove mapping — try disabling it instead.");
      return;
    }
    await load();
  }

  const mappedIds = new Set(mappings?.map((m) => m.constituency.id));

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="max-w-sm flex-1">
          <StateSelector value={stateId} onChange={handleStateChange} required />
        </div>
        <div className="max-w-sm flex-1">
          <ElectionSelector stateId={stateId} value={electionId} onChange={handleElectionChange} required />
        </div>
      </div>

      {electionId && (
        <div className="card-surface mt-6 rounded-2xl p-5">
          <p className="mb-3 text-sm font-semibold">Add a constituency to this election</p>
          <ErrorBanner message={addError} />
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <DistrictSelector stateId={stateId} value={addDistrictId} onChange={handleAddDistrictChange} label="District" />
            <ConstituencySelector stateId={stateId} districtId={addDistrictId} value={addConstituencyId} onChange={setAddConstituencyId} label="Constituency" />
            <div className="flex items-end">
              <Button size="sm" onClick={addMapping} disabled={adding || !addConstituencyId || mappedIds.has(addConstituencyId)}>
                <Plus size={15} /> {adding ? "Adding..." : "Add mapping"}
              </Button>
            </div>
          </div>
          {addConstituencyId && mappedIds.has(addConstituencyId) && (
            <p className="mt-2 text-xs text-muted">This constituency is already mapped to this election.</p>
          )}
        </div>
      )}

      {electionId && (
        <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="p-3">AC#</th>
                <th className="p-3">Constituency</th>
                <th className="p-3">District</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {listError && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-danger">
                    {listError}
                  </td>
                </tr>
              )}
              {!listError && mappings === null && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              )}
              {!listError && mappings?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted">
                    No constituencies mapped to this election yet.
                  </td>
                </tr>
              )}
              {mappings?.map((m) => (
                <tr key={m.id} className="border-b border-border/60">
                  <td className="p-3">{m.constituency.number}</td>
                  <td className="p-3 font-medium">{m.constituency.name}</td>
                  <td className="p-3 text-muted">{m.constituency.district.name}</td>
                  <td className="p-3">
                    <span className={m.isActive ? "text-positive" : "text-muted"}>{m.isActive ? "Active" : "Disabled"}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleActive(m)} className="text-ink hover:opacity-70" aria-label={`Toggle ${m.constituency.name}`}>
                        <Power size={15} />
                      </button>
                      <button onClick={() => removeMapping(m)} className="text-danger hover:opacity-70" aria-label={`Remove ${m.constituency.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
