import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CANDIDATE_STATUS_LABELS, type CandidateStatus } from "@/lib/enums";
import { Plus } from "lucide-react";

export default async function AdminCandidatesPage({
  searchParams,
}: {
  searchParams: Promise<{ constituencyId?: string; electionId?: string }>;
}) {
  const { constituencyId, electionId } = await searchParams;

  const [candidates, scopedConstituency] = await Promise.all([
    prisma.candidate.findMany({
      where: {
        ...(constituencyId ? { constituencyId } : {}),
        ...(electionId ? { electionId } : {}),
      },
      include: { party: true, constituency: { include: { district: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    constituencyId ? prisma.constituency.findUnique({ where: { id: constituencyId }, select: { name: true } }) : null,
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

      <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Name</th>
              <th className="p-3">Constituency</th>
              <th className="p-3">Party</th>
              <th className="p-3">Status</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Photo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {candidates.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted">
                  No candidates yet. Add one, or use CSV Import for bulk entry.
                </td>
              </tr>
            )}
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted">
                  {c.constituency.name} ({c.constituency.district.name})
                </td>
                <td className="p-3">{c.party?.shortName ?? "—"}</td>
                <td className="p-3">{CANDIDATE_STATUS_LABELS[c.status as CandidateStatus] ?? c.status}</td>
                <td className="p-3">{c.confidenceScore}</td>
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
