import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AccountSettingsForm } from "@/components/admin/AccountSettingsForm";

export default async function AdminAccountPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold">Account Settings</h1>
      <p className="mt-1 text-sm text-muted">Manage the login email and password for your admin account.</p>
      <div className="mt-6 max-w-xl">
        <AccountSettingsForm currentEmail={session.email} />
      </div>
    </div>
  );
}
