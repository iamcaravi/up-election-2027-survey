"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LinkButton } from "@/components/ui/Button";
import { StateSelector } from "./selectors/StateSelector";
import { ElectionSelector } from "./selectors/ElectionSelector";
import { DistrictSelector } from "./selectors/DistrictSelector";
import { ConstituencySelector } from "./selectors/ConstituencySelector";
import { Plus, Search } from "lucide-react";

interface SurveyRow {
  id: string;
  title: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  election: { id: string; name: string; year: number };
  constituency: { id: string; name: string; number: number; district: { id: string; name: string } };
  _count: { responses: number; questions: number };
}

export function SurveysManager() {
  const searchParams = useSearchParams();
  const [stateId, setStateId] = useState(searchParams.get("stateId") ?? "");
  const [electionId, setElectionId] = useState(searchParams.get("electionId") ?? "");
  const [districtId, setDistrictId] = useState(searchParams.get("districtId") ?? "");
  const [constituencyId, setConstituencyId] = useState(searchParams.get("constituencyId") ?? "");
  const [query, setQuery] = useState("");

  const [surveys, setSurveys] = useState<SurveyRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!stateId) {
      setSurveys(null);
      return;
    }
    setListError(null);
    const qs = new URLSearchParams({
      stateId,
      ...(electionId ? { electionId } : {}),
      ...(districtId ? { districtId } : {}),
      ...(constituencyId ? { constituencyId } : {}),
      ...(query ? { q: query } : {}),
    });
    const res = await fetch(`/api/admin/surveys?${qs}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setListError(data?.error ?? "Failed to load surveys.");
      return;
    }
    setSurveys(data);
  }, [stateId, electionId, districtId, constituencyId, query]);

  useEffect(() => {
    const handle = setTimeout(load, 200);
    return () => clearTimeout(handle);
  }, [load]);

  // Changing a parent scope clears every dependent selection — never leave
  // a stale district/constituency selected against a different state.
  function handleStateChange(id: string) {
    setStateId(id);
    setElectionId("");
    setDistrictId("");
    setConstituencyId("");
  }
  function handleElectionChange(id: string) {
    setElectionId(id);
  }
  function handleDistrictChange(id: string) {
    setDistrictId(id);
    setConstituencyId("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="max-w-xs flex-1">
          <StateSelector value={stateId} onChange={handleStateChange} required />
        </div>
        {stateId && (
          <div className="max-w-xs flex-1">
            <ElectionSelector stateId={stateId} value={electionId} onChange={handleElectionChange} label="Filter by election" />
          </div>
        )}
        {stateId && (
          <div className="max-w-xs flex-1">
            <DistrictSelector stateId={stateId} value={districtId} onChange={handleDistrictChange} label="Filter by district" />
          </div>
        )}
        {stateId && (
          <div className="max-w-xs flex-1">
            <ConstituencySelector
              stateId={stateId}
              districtId={districtId}
              value={constituencyId}
              onChange={setConstituencyId}
              label="Filter by constituency"
            />
          </div>
        )}
        {stateId && (
          <div className="relative max-w-xs flex-1">
            <label className="mb-1.5 block text-sm font-medium">Search</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 mt-[11px] -translate-y-1/2 text-muted" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search survey title..."
              aria-label="Search surveys"
              className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
            />
          </div>
        )}
        {stateId && (
          <LinkButton href={`/admin/surveys/new?stateId=${stateId}`} size="sm">
            <Plus size={15} /> Create Survey
          </LinkButton>
        )}
      </div>

      {stateId && (
        <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="p-3">Title</th>
                <th className="p-3">Election</th>
                <th className="p-3">Constituency</th>
                <th className="p-3">District</th>
                <th className="p-3">Status</th>
                <th className="p-3">Responses</th>
                <th className="p-3">Questions</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {listError && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-danger">
                    {listError}
                  </td>
                </tr>
              )}
              {!listError && surveys === null && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted">
                    Loading...
                  </td>
                </tr>
              )}
              {!listError && surveys?.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted">
                    No surveys found for this scope.
                  </td>
                </tr>
              )}
              {surveys?.map((s) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">
                    <Link href={`/admin/surveys/${s.id}/edit`} className="hover:underline">
                      {s.title}
                    </Link>
                  </td>
                  <td className="p-3 text-muted">
                    {s.election.name} ({s.election.year})
                  </td>
                  <td className="p-3 text-muted">
                    AC #{s.constituency.number} · {s.constituency.name}
                  </td>
                  <td className="p-3 text-muted">{s.constituency.district.name}</td>
                  <td className="p-3">
                    <span className={s.isActive ? "text-positive" : "text-muted"}>{s.isActive ? s.status : "Disabled"}</span>
                  </td>
                  <td className="p-3">{s._count.responses}</td>
                  <td className="p-3">{s._count.questions}</td>
                  <td className="p-3">
                    <Link href={`/admin/surveys/${s.id}/edit`} className="font-medium text-ink underline underline-offset-2">
                      Edit
                    </Link>
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
