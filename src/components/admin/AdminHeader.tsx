"use client";

import Link from "next/link";
import { Bell, Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Top bar shared by every authenticated admin page. Sits to the right of
// (desktop) / above (mobile, with a hamburger that opens) AdminSidebar.
export function AdminHeader({
  userName,
  userRole,
  onMenuClick,
}: {
  userName: string;
  userRole: string;
  onMenuClick?: () => void;
}) {
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleLabel = userRole === "ADMIN" ? "Administrator" : userRole === "MODERATOR" ? "Moderator" : "Editor";

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-surface-2 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex items-end gap-1">
            <span className="h-4 w-1.5 rounded-sm bg-accent" />
            <span className="h-6 w-1.5 rounded-sm bg-positive" />
            <span className="h-3.5 w-1.5 rounded-sm bg-ink" />
          </span>
          <span className="hidden flex-col justify-center leading-tight sm:flex">
            <span className="font-display text-base font-extrabold lowercase text-foreground">votersurvey.in</span>
            <span className="text-[10px] font-medium text-muted">जनता की राय, बेहतर कल के लिए</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 hover:bg-surface-2"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
            )}
          >
            3
          </span>
        </button>

        <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
            {initials || "A"}
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-semibold text-foreground">{userName}</span>
            <span className="text-[11px] text-muted">{roleLabel}</span>
          </span>
          <ChevronDown size={15} className="hidden text-muted sm:block" />
        </div>
      </div>
    </header>
  );
}
