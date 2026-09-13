import { getAdminSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    return <div className="min-h-screen bg-surface-2">{children}</div>;
  }
  return (
    <AdminShell userName={session.name} userRole={session.role}>
      {children}
    </AdminShell>
  );
}
