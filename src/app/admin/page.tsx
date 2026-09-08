import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";

export default async function AdminDashboard() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [responsesToday, responsesWeek, totalValid, flagged, activeSurveys, topConstituencies] = await Promise.all([
    prisma.surveyResponse.count({ where: { createdAt: { gte: startOfToday }, status: "VALID" } }),
    prisma.surveyResponse.count({ where: { createdAt: { gte: startOfWeek }, status: "VALID" } }),
    prisma.surveyResponse.count({ where: { status: "VALID" } }),
    prisma.surveyResponse.count({ where: { status: "FLAGGED" } }),
    prisma.survey.count({ where: { isActive: true } }),
    prisma.constituency.findMany({
      include: { _count: { select: { surveyResponses: true } }, district: true },
      orderBy: { surveyResponses: { _count: "desc" } },
      take: 8,
    }),
  ]);

  const cards = [
    { label: "Responses Today", value: responsesToday },
    { label: "Responses This Week", value: responsesWeek },
    { label: "Total Valid Responses", value: totalValid },
    { label: "Flagged Responses", value: flagged },
    { label: "Active Surveys", value: activeSurveys },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card-surface rounded-2xl p-5">
            <p className="font-display text-2xl font-extrabold">{formatNumber(c.value)}</p>
            <p className="mt-1 text-xs text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Highest Participation Constituencies</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 pr-4">Constituency</th>
                <th className="pb-2 pr-4">District</th>
                <th className="pb-2">Responses</th>
              </tr>
            </thead>
            <tbody>
              {topConstituencies.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4 text-muted">{c.district.name}</td>
                  <td className="py-2">{formatNumber(c._count.surveyResponses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
