import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";

export default async function ModerationPage() {
  const flags = await prisma.moderationFlag.findMany({
    include: { response: { include: { constituency: true, survey: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Moderation</h1>
      <p className="mt-1 text-sm text-muted">Responses flagged or rejected by automated anti-abuse checks.</p>

      <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Constituency</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Response Status</th>
              <th className="p-3">When</th>
              <th className="p-3">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {flags.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  No flagged responses.
                </td>
              </tr>
            )}
            {flags.map((f) => (
              <tr key={f.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{f.response.constituency.name}</td>
                <td className="p-3 text-muted">{f.reason}</td>
                <td className="p-3">{f.severity}</td>
                <td className="p-3">{f.response.status}</td>
                <td className="p-3 text-muted">{timeAgo(f.createdAt)}</td>
                <td className="p-3">{f.resolvedAt ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
