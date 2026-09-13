import Link from "next/link";
import {
  Users,
  UserCheck,
  MapPin,
  UserCog,
  PlusCircle,
  FlagTriangleRight,
  UserPlus,
  BarChart3,
  Download,
  Settings as SettingsIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/admin/ui/StatCard";
import { DailyResponsesChart, PartySupportDonut } from "@/components/admin/dashboard/DashboardCharts";

// Every count on this page is scoped to dataSource: "real" — the admin's own
// operational view of the platform must never be inflated by the Demo Data
// Mode synthetic dataset, regardless of whether that mode happens to be on
// for the public site right now.
const REAL = { dataSource: "real" } as const;

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [
    totalResponses,
    responsesLastWeek,
    responsesPriorWeek,
    activeElections,
    totalConstituencies,
    totalCandidates,
    weekResponses,
    partyAnswers,
    recentAudits,
    upcomingElections,
  ] = await Promise.all([
    prisma.surveyResponse.count({ where: { status: "VALID", ...REAL } }),
    prisma.surveyResponse.count({ where: { status: "VALID", createdAt: { gte: startOfWeek }, ...REAL } }),
    prisma.surveyResponse.count({
      where: { status: "VALID", createdAt: { gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000), lt: startOfWeek }, ...REAL },
    }),
    prisma.election.count({ where: { status: "ONGOING" } }),
    prisma.constituency.count(),
    prisma.candidate.count({ where: { isActive: true } }),
    prisma.surveyResponse.findMany({
      where: { status: "VALID", createdAt: { gte: sevenDaysAgo }, ...REAL },
      select: { createdAt: true },
    }),
    prisma.surveyAnswer.findMany({
      where: {
        response: { status: "VALID", ...REAL },
        question: { key: "party_preference" },
        optionId: { not: null },
      },
      select: { option: { select: { key: true, label: true, party: { select: { nameEnglish: true, shortName: true, colorHex: true } } } } },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { adminUser: { select: { name: true } } } }),
    prisma.election.findMany({
      where: { status: { in: ["UPCOMING", "ONGOING"] } },
      orderBy: { electionDate: "asc" },
      take: 4,
      include: { state: true },
    }),
  ]);

  const weeklyDelta = responsesPriorWeek > 0 ? Math.round(((responsesLastWeek - responsesPriorWeek) / responsesPriorWeek) * 100) : null;

  // Bucket the last 7 days of responses by calendar day for the bar chart.
  const dayFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });
  const days: { key: string; label: string; count: number }[] = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    return { key: d.toDateString(), label: dayFormatter.format(d), count: 0 };
  });
  const dayIndex = new Map(days.map((d, i) => [d.key, i]));
  for (const response of weekResponses) {
    const idx = dayIndex.get(response.createdAt.toDateString());
    if (idx !== undefined) days[idx].count += 1;
  }

  // Aggregate party support across every real party_preference answer.
  const partyCounts = new Map<string, { label: string; color: string | null; count: number }>();
  for (const answer of partyAnswers) {
    const option = answer.option;
    if (!option || option.key === "other" || option.key === "nota" || option.key === "undecided") continue;
    const label = option.party?.shortName ?? option.label;
    const existing = partyCounts.get(label);
    if (existing) existing.count += 1;
    else partyCounts.set(label, { label, color: option.party?.colorHex ?? null, count: 1 });
  }
  const partyData = Array.from(partyCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((p) => ({ name: p.label, value: p.count, color: p.color }));
  const partyTotal = partyAnswers.length;

  const cards = [
    {
      icon: <Users size={20} />,
      iconClass: "bg-blue-100 text-blue-700",
      label: "कुल प्रतिक्रियाएं",
      value: formatNumber(totalResponses),
      trend: weeklyDelta !== null ? { direction: (weeklyDelta >= 0 ? "up" : "down") as "up" | "down", label: `${Math.abs(weeklyDelta)}%` } : undefined,
      subtext: `+${formatNumber(responsesLastWeek)} this week`,
    },
    {
      icon: <UserCheck size={20} />,
      iconClass: "bg-positive/10 text-positive",
      label: "सक्रिय चुनाव",
      value: formatNumber(activeElections),
      subtext: "Currently running",
    },
    {
      icon: <MapPin size={20} />,
      iconClass: "bg-purple-100 text-purple-700",
      label: "कुल विधानसभा क्षेत्र",
      value: formatNumber(totalConstituencies),
      subtext: "Across all states",
    },
    {
      icon: <UserCog size={20} />,
      iconClass: "bg-orange-100 text-orange-700",
      label: "कुल उम्मीदवार",
      value: formatNumber(totalCandidates),
      subtext: "Verified & active",
    },
  ];

  const quickActions = [
    { label: "नया चुनाव जोड़ें", href: "/admin/elections", icon: <PlusCircle size={18} />, color: "bg-blue-50 text-blue-700" },
    { label: "नई विधानसभा जोड़ें", href: "/admin/constituencies", icon: <FlagTriangleRight size={18} />, color: "bg-positive/10 text-positive" },
    { label: "उम्मीदवार जोड़ें", href: "/admin/candidates/new", icon: <UserPlus size={18} />, color: "bg-pink-50 text-pink-700" },
    { label: "डेटा देखें", href: "/admin/moderation", icon: <BarChart3 size={18} />, color: "bg-orange-50 text-orange-700" },
    { label: "डेटा एक्सपोर्ट करें", href: "/admin/imports", icon: <Download size={18} />, color: "bg-purple-50 text-purple-700" },
    { label: "सेटिंग्स", href: "/admin/settings", icon: <SettingsIcon size={18} />, color: "bg-surface-2 text-ink" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Welcome back, {recentAudits[0]?.adminUser?.name?.split(" ")[0] ?? "Admin"}! Here&apos;s an overview of your platform.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-surface rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-display text-base font-bold text-ink">दैनिक सर्वे प्रतिक्रियाएँ</h2>
          <p className="text-xs text-muted">Last 7 days, real responses only</p>
          <div className="mt-3">
            <DailyResponsesChart data={days} />
          </div>
        </div>

        <div className="card-surface rounded-2xl p-5">
          <h2 className="font-display text-base font-bold text-ink">पार्टी समर्थन (कुल)</h2>
          <p className="text-xs text-muted">Across all real responses</p>
          <div className="mt-4">
            {partyData.length > 0 ? (
              <PartySupportDonut data={partyData} total={partyTotal} centerLabel="प्रतिक्रियाएँ" />
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
                अभी पर्याप्त डेटा उपलब्ध नहीं है।
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-surface rounded-2xl p-5 lg:col-span-1">
          <h2 className="font-display text-base font-bold text-ink">हाल की गतिविधियाँ</h2>
          <ul className="mt-3 space-y-3">
            {recentAudits.length === 0 && <p className="text-sm text-muted">No recent activity yet.</p>}
            {recentAudits.map((log) => (
              <li key={log.id} className="text-sm">
                <p className="text-foreground">
                  {formatAuditAction(log.action, log.entityType)}
                  {log.adminUser?.name && <span className="text-muted"> — {log.adminUser.name}</span>}
                </p>
                <p className="text-xs text-muted">{formatRelativeTime(log.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-ink">आगामी चुनाव</h2>
            <Link href="/admin/elections" className="text-xs font-semibold text-blue-700 hover:underline">
              View All
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {upcomingElections.length === 0 && <p className="text-sm text-muted">No upcoming elections.</p>}
            {upcomingElections.map((election) => (
              <li key={election.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{election.name}</p>
                  <p className="text-xs text-muted">{election.electionDate ? formatMonthYear(election.electionDate) : "TBD"}</p>
                </div>
                <span
                  className={
                    election.status === "ONGOING"
                      ? "shrink-0 rounded-full bg-positive/10 px-2.5 py-1 text-[11px] font-bold text-positive"
                      : "shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-700"
                  }
                >
                  {election.status === "ONGOING" ? "सक्रिय" : "तैयारी में"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-surface rounded-2xl p-5">
          <h2 className="font-display text-base font-bold text-ink">त्वरित कार्य</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-start gap-2 rounded-xl border border-border p-3 text-left transition-colors hover:bg-surface-2"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.color}`}>{action.icon}</span>
                <span className="text-xs font-semibold leading-tight text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatAuditAction(action: string, entityType: string): string {
  const verb = action.split("_")[0]?.toLowerCase();
  const friendlyVerb = verb === "create" ? "Created" : verb === "update" ? "Updated" : verb === "delete" ? "Deleted" : action;
  return `${friendlyVerb} ${entityType}`;
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(date);
}
