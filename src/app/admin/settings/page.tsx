import { prisma } from "@/lib/prisma";
import { getSiteSetting } from "@/lib/data";
import { MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "@/lib/enums";
import { SettingsTabs } from "@/components/admin/SettingsTabs";

export default async function SettingsPage() {
  const [minGroupSize, electionPeriod, settingRow] = await Promise.all([
    getSiteSetting("MIN_ANALYTICS_GROUP_SIZE", MIN_ANALYTICS_GROUP_SIZE_DEFAULT),
    getSiteSetting("ELECTION_PERIOD_MODE", { restricted: false, note: "" }),
    prisma.siteSetting.findFirst({
      where: { key: { in: ["MIN_ANALYTICS_GROUP_SIZE", "ELECTION_PERIOD_MODE"] } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const updatedAt = settingRow
    ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(
        settingRow.updatedAt
      )
    : null;

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Site Settings &amp; Compliance</h1>
      <p className="mt-1 text-sm text-muted">Manage platform settings, privacy, content and compliance for votersurvey.in.</p>

      <div className="mt-6">
        <SettingsTabs minGroupSize={minGroupSize} electionPeriod={electionPeriod} updatedAt={updatedAt} />
      </div>
    </div>
  );
}
