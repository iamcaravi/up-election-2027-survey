import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/utils";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    include: { adminUser: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Audit Logs</h1>

      <div className="mt-6 card-surface overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Admin</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted">
                  No activity yet.
                </td>
              </tr>
            )}
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{l.adminUser?.email ?? "—"}</td>
                <td className="p-3">{l.action}</td>
                <td className="p-3 text-muted">
                  {l.entityType} {l.entityId ? `#${l.entityId.slice(0, 8)}` : ""}
                </td>
                <td className="p-3 text-muted">{timeAgo(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
