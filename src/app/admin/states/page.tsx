import { Globe2, Vote, CheckCircle2, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/admin/ui/StatCard";
import { StatesManager } from "@/components/admin/StatesManager";

export default async function AdminStatesPage() {
  const [totalStates, activeStates, totalElections, activeElections, upcomingElections] = await Promise.all([
    prisma.state.count(),
    prisma.state.count({ where: { isActive: true } }),
    prisma.election.count(),
    prisma.election.count({ where: { status: "ONGOING" } }),
    prisma.election.count({ where: { status: "UPCOMING" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">States &amp; Elections</h1>
      <p className="mt-1 text-sm text-muted">Manage states and their elections. Add, edit or archive election data.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Globe2 size={20} />}
          iconClass="bg-blue-100 text-blue-700"
          label="Total States"
          value={formatNumber(totalStates)}
          subtext={`${formatNumber(activeStates)} Active, ${formatNumber(totalStates - activeStates)} Archived`}
        />
        <StatCard
          icon={<Vote size={20} />}
          iconClass="bg-purple-100 text-purple-700"
          label="Total Elections"
          value={formatNumber(totalElections)}
          subtext={`${formatNumber(activeElections)} Active, ${formatNumber(upcomingElections)} Upcoming`}
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-positive/10 text-positive"
          label="Active Elections"
          value={formatNumber(activeElections)}
          subtext="Currently running"
        />
        <StatCard
          icon={<Clock size={20} />}
          iconClass="bg-orange-100 text-orange-700"
          label="Upcoming Elections"
          value={formatNumber(upcomingElections)}
          subtext="Not yet started"
        />
      </div>

      <div className="mt-6">
        <StatesManager />
      </div>
    </div>
  );
}
