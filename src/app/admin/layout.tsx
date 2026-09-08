import { getAdminSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    return <div className="min-h-screen bg-surface-2">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-surface-2">
      <AdminSidebar userName={session.name} userRole={session.role} />
      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
