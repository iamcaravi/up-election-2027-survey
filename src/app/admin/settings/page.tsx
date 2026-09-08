import { getSiteSetting } from "@/lib/data";
import { MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "@/lib/enums";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const minGroupSize = await getSiteSetting("MIN_ANALYTICS_GROUP_SIZE", MIN_ANALYTICS_GROUP_SIZE_DEFAULT);
  const electionPeriod = await getSiteSetting("ELECTION_PERIOD_MODE", { restricted: false, note: "" });

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Settings</h1>
      <div className="mt-6 max-w-xl">
        <SettingsForm minGroupSize={minGroupSize} electionPeriod={electionPeriod} />
      </div>
    </div>
  );
}
