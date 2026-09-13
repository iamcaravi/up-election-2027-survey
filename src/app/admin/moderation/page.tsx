import Link from "next/link";
import { FileText, CheckCircle2, Flag, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, timeAgo } from "@/lib/utils";
import { StatCard } from "@/components/admin/ui/StatCard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const TABS = [
  { key: "ALL", label: "All Responses" },
  { key: "VALID", label: "Valid" },
  { key: "FLAGGED", label: "Flagged" },
  { key: "REJECTED", label: "Rejected" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab: TabKey = (TABS.find((t) => t.key === params.status)?.key ?? "ALL") as TabKey;
  const page = Math.max(1, Number(params.page) || 1);

  const [total, valid, flagged, rejected] = await Promise.all([
    prisma.surveyResponse.count({ where: { dataSource: "real" } }),
    prisma.surveyResponse.count({ where: { dataSource: "real", status: "VALID" } }),
    prisma.surveyResponse.count({ where: { dataSource: "real", status: "FLAGGED" } }),
    prisma.surveyResponse.count({ where: { dataSource: "real", status: "REJECTED" } }),
  ]);

  const where = { dataSource: "real", ...(tab === "ALL" ? {} : { status: tab }) } as const;
  const [rows, rowCount] = await Promise.all([
    prisma.surveyResponse.findMany({
      where,
      include: { constituency: true, survey: { select: { title: true } }, moderationFlags: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.surveyResponse.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(rowCount / PAGE_SIZE));

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Survey Responses</h1>
      <p className="mt-1 text-sm text-muted">View, validate and moderate survey responses. Ensure data quality and prevent misuse.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<FileText size={20} />} iconClass="bg-blue-100 text-blue-700" label="Total Responses" value={formatNumber(total)} />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-positive/10 text-positive"
          label="Valid Responses"
          value={formatNumber(valid)}
          subtext={total > 0 ? `${((valid / total) * 100).toFixed(1)}%` : undefined}
        />
        <StatCard
          icon={<Flag size={20} />}
          iconClass="bg-orange-100 text-orange-700"
          label="Flagged (Pending Review)"
          value={formatNumber(flagged)}
          subtext={total > 0 ? `${((flagged / total) * 100).toFixed(1)}%` : undefined}
        />
        <StatCard
          icon={<XCircle size={20} />}
          iconClass="bg-danger/10 text-danger"
          label="Rejected Responses"
          value={formatNumber(rejected)}
          subtext={total > 0 ? `${((rejected / total) * 100).toFixed(1)}%` : undefined}
        />
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/moderation?status=${t.key}`}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-semibold transition-colors",
              tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 card-surface overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <th className="p-3">Date &amp; Time</th>
              <th className="p-3">Constituency</th>
              <th className="p-3">Survey</th>
              <th className="p-3">Status</th>
              <th className="p-3">Flag Reason</th>
              <th className="p-3">Device</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted">
                  No responses in this view yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="p-3 text-muted">{timeAgo(r.createdAt)}</td>
                <td className="p-3 font-medium text-foreground">{r.constituency.name}</td>
                <td className="p-3 text-muted">{r.survey.title}</td>
                <td className="p-3">
                  <StatusPill status={r.status} />
                </td>
                <td className="p-3 text-muted">{r.moderationFlags[0]?.reason ?? "—"}</td>
                <td className="p-3 text-muted">{r.fingerprint ? "Web (hashed)" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>
            Page {page} of {totalPages} · {formatNumber(rowCount)} responses
          </span>
          <div className="flex gap-2">
            <Link
              href={`/admin/moderation?status=${tab}&page=${Math.max(1, page - 1)}`}
              className={cn("rounded-lg border border-border px-3 py-1.5", page <= 1 && "pointer-events-none opacity-40")}
            >
              Previous
            </Link>
            <Link
              href={`/admin/moderation?status=${tab}&page=${Math.min(totalPages, page + 1)}`}
              className={cn("rounded-lg border border-border px-3 py-1.5", page >= totalPages && "pointer-events-none opacity-40")}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "VALID"
      ? "bg-positive/10 text-positive"
      : status === "FLAGGED"
        ? "bg-orange-100 text-orange-700"
        : "bg-danger/10 text-danger";
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", styles)}>{status}</span>;
}
