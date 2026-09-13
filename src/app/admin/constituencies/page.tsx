import { Suspense } from "react";
import { MapPin, CheckCircle2, Users, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/admin/ui/StatCard";
import { ConstituenciesManager } from "@/components/admin/ConstituenciesManager";

export default async function AdminConstituenciesPage() {
  const [totalConstituencies, activeConstituencies, totalCandidates, totalResponses] = await Promise.all([
    prisma.constituency.count(),
    prisma.constituency.count({ where: { electionConstituencies: { some: { isActive: true } } } }),
    prisma.candidate.count(),
    prisma.surveyResponse.count({ where: { status: "VALID", dataSource: "real" } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Constituency Management</h1>
      <p className="mt-1 text-sm text-muted">Manage constituencies for elections. Add, edit, map districts and candidates.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<MapPin size={20} />} iconClass="bg-orange-100 text-orange-700" label="Total Constituencies" value={formatNumber(totalConstituencies)} />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-positive/10 text-positive"
          label="Active Constituencies"
          value={formatNumber(activeConstituencies)}
          subtext={totalConstituencies > 0 ? `${Math.round((activeConstituencies / totalConstituencies) * 100)}% active` : undefined}
        />
        <StatCard icon={<Users size={20} />} iconClass="bg-purple-100 text-purple-700" label="Total Candidates" value={formatNumber(totalCandidates)} subtext="Across all constituencies" />
        <StatCard icon={<FileText size={20} />} iconClass="bg-blue-100 text-blue-700" label="Total Survey Responses" value={formatNumber(totalResponses)} subtext="Real responses only" />
      </div>

      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <ConstituenciesManager />
        </Suspense>
      </div>
    </div>
  );
}
