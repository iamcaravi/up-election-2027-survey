"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Settings,
  Type,
  ScrollText,
  LogOut,
  ExternalLink,
  Globe,
  Vote,
  Map,
  Link2,
  ClipboardList,
  UserCog,
  GalleryHorizontal,
  FlaskConical,
  MapPin,
  Flag as PartyFlag,
  BarChart3,
  FileDown,
  FileBarChart,
  X,
} from "lucide-react";

const TOP_NAV = [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }];

const MANAGE_ELECTIONS_NAV = [
  { href: "/admin/states", label: "States", icon: Globe },
  { href: "/admin/elections", label: "Elections", icon: Vote },
  { href: "/admin/districts", label: "Districts", icon: Map },
  { href: "/admin/constituencies", label: "Constituencies", icon: MapPin },
  { href: "/admin/election-constituencies", label: "Election ↔ Constituency", icon: Link2 },
  { href: "/admin/parties", label: "Parties", icon: PartyFlag },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
];

const SURVEYS_DATA_NAV = [
  { href: "/admin/surveys", label: "Survey Management", icon: ClipboardList },
  { href: "/admin/moderation", label: "Survey Responses", icon: BarChart3 },
  { href: "/admin/analytics", label: "Analytics", icon: FileBarChart },
  { href: "/admin/synthetic-data", label: "Demo Data Mode", icon: FlaskConical },
  { href: "/admin/imports", label: "Export / Import Data", icon: FileDown },
];

const SYSTEM_NAV = [
  { href: "/admin/account", label: "Users", icon: UserCog },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/hero", label: "Site Content", icon: Type },
  { href: "/admin/survey-hero", label: "Hero Visual Editor", icon: GalleryHorizontal },
  { href: "/admin/images", label: "Image Review", icon: ImageIcon },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
];

export function AdminSidebar({
  userName,
  userRole,
  mobileOpen = false,
  onCloseMobile,
}: {
  userName: string;
  userRole: string;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col bg-[#0b1830] p-4 text-white transition-transform lg:static lg:z-auto lg:translate-x-0",
          mobileOpen && "translate-x-0"
        )}
      >
        <div className="mb-2 flex items-center justify-between px-1 lg:hidden">
          <span className="font-display text-base font-extrabold">votersurvey.in</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto">
          <div className="space-y-1">
            {TOP_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onCloseMobile} />
            ))}
          </div>

          <NavGroup title="Manage Elections" items={MANAGE_ELECTIONS_NAV} pathname={pathname} onNavigate={onCloseMobile} />
          <NavGroup title="Surveys & Data" items={SURVEYS_DATA_NAV} pathname={pathname} onNavigate={onCloseMobile} />
          <NavGroup title="System" items={SYSTEM_NAV} pathname={pathname} onNavigate={onCloseMobile} />

          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink size={16} /> Back to Website
          </Link>
        </nav>

        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="truncate px-2 text-sm font-medium text-white">{userName}</p>
          <p className="px-2 text-xs text-white/50">{userRole === "ADMIN" ? "Administrator" : userRole}</p>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-300 hover:bg-white/10"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: { href: string; label: string; icon: React.ComponentType<{ size?: number }> }[];
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-white/40">{title}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ size?: number }> };
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-blue-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <item.icon size={16} />
      {item.label}
    </Link>
  );
}
