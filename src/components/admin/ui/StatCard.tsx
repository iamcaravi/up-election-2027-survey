import { cn } from "@/lib/utils";

// Shared stat-card used across every admin list/dashboard page (Dashboard,
// States & Elections, Constituency Management, Survey Management, Survey
// Responses, ...). Trend/subtext are optional so pages without a
// week-over-week comparison can still use the same card shape.
export function StatCard({
  icon,
  iconClass = "bg-blue-100 text-blue-700",
  label,
  value,
  trend,
  subtext,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  label: string;
  value: string | number;
  trend?: { direction: "up" | "down"; label: string };
  subtext?: string;
}) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl font-extrabold text-ink">{value}</p>
          <p className="mt-1 truncate text-sm font-medium text-muted">{label}</p>
        </div>
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconClass)}>{icon}</span>
      </div>
      {(trend || subtext) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          {trend && (
            <span className={cn("font-bold", trend.direction === "up" ? "text-positive" : "text-danger")}>
              {trend.direction === "up" ? "↑" : "↓"} {trend.label}
            </span>
          )}
          {subtext && <span className="truncate">{subtext}</span>}
        </p>
      )}
    </div>
  );
}
