"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Upload,
  Settings,
  ScrollText,
  LogOut,
  Flag,
  ExternalLink,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/images", label: "Image Review", icon: ImageIcon },
  { href: "/admin/imports", label: "Imports", icon: Upload },
  { href: "/admin/moderation", label: "Moderation", icon: Flag },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-6 px-2">
        <p className="font-display text-lg font-extrabold">Admin</p>
        <p className="text-xs text-muted">India Election Survey</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-ink text-white" : "text-foreground/70 hover:bg-surface-2 hover:text-foreground"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 hover:bg-surface-2 hover:text-foreground"
        >
          <ExternalLink size={16} /> View site
        </Link>
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        <p className="truncate px-2 text-sm font-medium">{userName}</p>
        <p className="px-2 text-xs text-muted">{userRole}</p>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
