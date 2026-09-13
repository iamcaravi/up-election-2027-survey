"use client";

import { useState } from "react";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({
  userName,
  userRole,
  children,
}: {
  userName: string;
  userRole: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-2">
      <AdminHeader userName={userName} userRole={userRole} onMenuClick={() => setMobileOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar userName={userName} userRole={userRole} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
