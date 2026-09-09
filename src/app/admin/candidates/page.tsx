import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CANDIDATE_STATUSES, CANDIDATE_STATUS_LABELS, type CandidateStatus } from "@/lib/enums";
import { StatusBadge, PartyPill } from "@/components/ui/Badge";
import { Plus } from "lucide-react";

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    constituencyId?: string;
    electionId?: string;
    districtId?: string;
    partyId?: string;
    status?: string;
    verified?: string;
  }>;
}) {
  const { constituencyId, electionId, districtId, partyId, status, verified } = await searchParams;

  const where = {
    ...(constituencyId ? { constituencyId } : {}),
    ...(electionId ? { electionId } : {}),
    ...(districtId ? { constituency: { districtId } } : {}),
    ...(partyId ? { partyId } : {}),
    ...(status ? { status } : {}),
    ...(verified === "true" ? { verified: true } : verified === "false" ? { verified: false } : {}),
  };

  const [candidates, scopedConstituency, parties, districts] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: { party: true, constituency: { include: { district: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    constituencyId ? prisma.constituency.findUnique({ where: { id: constituencyId }, select: { name: true } }) : null,
    prisma.party.findMany({ orderBy: { displayOrder: "asc" } }),
    prisma.district.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Candidates</h1>
          {scopedConstituency && (
            <p className="mt-1 text-sm text-muted">
              Filtered to <strong className="text-foreground">{scopedConstituency.name}</strong> —{" "}
              <Link href="/admin/candidates" className="underline">
                clear filter
              </Link>
            </p>
          )}
        </div>
        <Link
          href="/admin/candidates/new"
          className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Add Candidate
        </Link>
      </div>

      <form method="GET" className="mt-6 flex flex-wrap items-end gap-3 card-surface rounded-2xl p-4">
        <FilterField label="District">
          <select name="districtId" defaultValue={districtId ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
            <option value="">All districts</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Party">
          <select name="partyId" defaultValue={partyId ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
            <option value="">All parties</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.shortName}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select name="status" defaultValue={status ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
            <option value="">All statuses</option>
            {CANDIDATE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CANDIDATE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Verified">
          <select name="verified" defaultValue={verified ?? ""} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm">
            <option value="">All</option>
            <option value="true">Verified only</option>
            <option value="false">Unverified only</option>
          </select>
        </FilterField>
        {constituencyId && <input type="hidden" name="constituencyId" value={constituencyId} />}
        {electionId && <input type="hidden" name="electionId" value={electionId} />}
        <button type="submit" className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white">
          Apply
        </button>
        {(districtId || partyId || status || verified) && (
          <Link href="/admin/candidates" className="text-sm text-muted underline">
            Clear filters
          </Link>
        )}
      </form>

      <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Name</th>
              <th className="p-3">Constituency</th>
              <th className="p-3">Party</th>
              <th className="p-3">Status</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Verified</th>
              <th className="p-3">Photo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted">
                  No candidates match these filters. Add one, or use CSV Import for bulk entry.
                </td>
              </tr>
            )}
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="p-3 font-medium">
                  {c.name}
                  {c.nameHindi && <span className="ml-1.5 text-muted">({c.nameHindi})</span>}
                </td>
                <td className="p-3 text-muted">
                  {c.constituency.name} ({c.constituency.district.name})
                </td>
                <td className="p-3">
                  {c.party ? <PartyPill shortName={c.party.shortName} colorHex={c.party.colorHex} /> : "—"}
                </td>
                <td className="p-3">
                  <StatusBadge status={(c.status in CANDIDATE_STATUS_LABELS ? c.status : "OTHER") as CandidateStatus} />
                </td>
                <td className="p-3">{c.confidenceScore}</td>
                <td className="p-3">{c.verified ? "Verified" : "—"}</td>
                <td className="p-3">
                  {c.photoUrl ? (c.photoVerified ? "Verified" : "Pending review") : "None"}
                </td>
                <td className="p-3">
                  <Link href={`/admin/candidates/${c.id}/edit`} className="font-medium text-ink underline underline-offset-2">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      {children}
    </label>
  );
}
