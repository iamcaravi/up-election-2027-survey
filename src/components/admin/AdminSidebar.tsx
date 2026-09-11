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
  Type,
  ScrollText,
  LogOut,
  Flag,
  ExternalLink,
  Globe,
  Vote,
  Map,
  Building2,
  Link2,
  ClipboardList,
  UserCog,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
];

const HIERARCHY_NAV = [
  { href: "/admin/states", label: "States", icon: Globe },
  { href: "/admin/elections", label: "Elections", icon: Vote },
  { href: "/admin/districts", label: "Districts", icon: Map },
  { href: "/admin/constituencies", label: "Constituencies", icon: Building2 },
  { href: "/admin/election-constituencies", label: "Election ↔ Constituency", icon: Link2 },
  { href: "/admin/surveys", label: "Surveys", icon: ClipboardList },
];

const CONTENT_NAV = [
  { href: "/admin/hero", label: "Homepage Editor", icon: Type },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/images", label: "Image Review", icon: ImageIcon },
  { href: "/admin/imports", label: "Imports", icon: Upload },
  { href: "/admin/moderation", label: "Moderation", icon: Flag },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/account", label: "Account Settings", icon: UserCog },
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

      <nav className="flex-1 space-y-4 overflow-y-auto">
        <div className="space-y-1">
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">India → States → Elections</p>
          <div className="space-y-1">
            {HIERARCHY_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">Content &amp; moderation</p>
          <div className="space-y-1">
            {CONTENT_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

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

function NavLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ size?: number }> };
  pathname: string | null;
}) {
  const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
  return (
    <Link
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
}
