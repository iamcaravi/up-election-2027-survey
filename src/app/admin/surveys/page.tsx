import { Suspense } from "react";
import { ClipboardList, CheckCircle2, CalendarClock, CalendarX } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { StatCard } from "@/components/admin/ui/StatCard";
import { SurveysManager } from "@/components/admin/SurveysManager";

export default async function AdminSurveysPage() {
  const now = new Date();
  const [totalSurveys, activeSurveys, scheduledSurveys, expiredSurveys] = await Promise.all([
    prisma.survey.count(),
    prisma.survey.count({ where: { isActive: true, status: "ACTIVE" } }),
    prisma.survey.count({ where: { startsAt: { gt: now } } }),
    prisma.survey.count({ where: { endsAt: { lt: now } } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Survey Management</h1>
      <p className="mt-1 text-sm text-muted">Create, edit and manage constituency-wise voter surveys.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<ClipboardList size={20} />} iconClass="bg-blue-100 text-blue-700" label="Total Surveys" value={formatNumber(totalSurveys)} subtext="Across all constituencies" />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          iconClass="bg-positive/10 text-positive"
          label="Active Surveys"
          value={formatNumber(activeSurveys)}
          subtext={totalSurveys > 0 ? `${Math.round((activeSurveys / totalSurveys) * 100)}% active` : undefined}
        />
        <StatCard icon={<CalendarClock size={20} />} iconClass="bg-orange-100 text-orange-700" label="Scheduled" value={formatNumber(scheduledSurveys)} subtext="Starts in future" />
        <StatCard icon={<CalendarX size={20} />} iconClass="bg-danger/10 text-danger" label="Expired" value={formatNumber(expiredSurveys)} subtext="Survey period ended" />
      </div>

      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
          <SurveysManager />
        </Suspense>
      </div>
    </div>
  );
}
