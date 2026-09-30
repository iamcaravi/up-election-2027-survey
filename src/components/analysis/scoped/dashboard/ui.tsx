import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Presentational building blocks of the Analysis dashboard (server-safe, no
// hooks): white rounded cards with a subtle border, navy headings, a tinted
// icon chip and small blue "→" actions — the visual language of the
// approved Analysis reference.

export const CARD = "rounded-2xl border border-[#e3e9f3] bg-white shadow-[0_1px_3px_rgba(15,31,75,0.05)]";

export function Card({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn(CARD, "min-w-0 scroll-mt-24 p-4 sm:p-5", className)}>
      {children}
    </section>
  );
}

const TONES = {
  blue: "bg-[#eaf2ff] text-[#1677ff]",
  orange: "bg-[#fff1e6] text-[#f97316]",
  green: "bg-[#e7f8ef] text-[#16a34a]",
  purple: "bg-[#f1ebff] text-[#7c3aed]",
  red: "bg-[#ffecec] text-[#e11d48]",
  amber: "bg-[#fff6db] text-[#d97706]",
  sky: "bg-[#e6f6fd] text-[#0284c7]",
} as const;
export type Tone = keyof typeof TONES;

export function IconChip({ tone, children, size = "md" }: { tone: Tone; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        TONES[tone],
        size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11 sm:h-12 sm:w-12" : "h-9 w-9"
      )}
    >
      {children}
    </span>
  );
}

export function CardHeader({ icon, tone, title, sub, action, as: As = "h2" }: { icon: ReactNode; tone: Tone; title: string; sub?: string; action?: ReactNode; as?: "h2" | "h3" }) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <IconChip tone={tone}>{icon}</IconChip>
        <div className="min-w-0">
          <As className="text-[16.5px] font-extrabold leading-tight tracking-tight text-[#0b1f3a] sm:text-[17px]">{title}</As>
          {sub && <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500">{sub}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Small outlined "सभी देखें →" pill (anchor: in-page link or new tab). */
export function PillLink({ href, children, newTab }: { href: string; children: ReactNode; newTab?: boolean }) {
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener" : undefined}
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[#d6e4ff] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1677ff] transition-colors hover:bg-[#f2f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      {children}
      <ArrowRight size={13} aria-hidden="true" />
    </a>
  );
}

/** Centered footer link of a chart card ("विस्तृत विश्लेषण →"). */
export function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <div className="mt-3 border-t border-slate-100 pt-2.5 text-center">
      <a href={href} className="inline-flex items-center gap-1 text-[13px] font-bold text-[#1677ff] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40">
        {children}
        <ArrowRight size={14} aria-hidden="true" />
      </a>
    </div>
  );
}

export const KPI_TONES = {
  blue: { card: "border-[#dbe7fb] bg-white", chip: "bg-[#eaf2ff] text-[#1677ff]" },
  green: { card: "border-[#cdebd9] bg-[#f1fbf5]", chip: "bg-[#16a34a] text-white" },
  amber: { card: "border-[#f6e3bf] bg-[#fffaf0]", chip: "bg-[#f59e0b] text-white" },
  red: { card: "border-[#f7d4d8] bg-[#fff5f6]", chip: "bg-[#ef4444] text-white" },
  purple: { card: "border-[#e2d7fb] bg-[#f8f5ff]", chip: "bg-[#8b5cf6] text-white" },
} as const;

export function KpiCard({
  tone,
  icon,
  label,
  value,
  sub,
  subClass,
}: {
  tone: keyof typeof KPI_TONES;
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  subClass?: string;
}) {
  const t = KPI_TONES[tone];
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 rounded-2xl border p-3 shadow-[0_1px_2px_rgba(15,31,75,0.04)] sm:gap-3.5 sm:p-4", t.card)}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12", t.chip)} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold text-slate-600 sm:text-[12.5px]">{label}</p>
        <p className="mt-0.5 text-[17px] font-black leading-tight text-[#0b1f3a] sm:text-[22px]">{value}</p>
        {sub && <p className={cn("mt-0.5 truncate text-[10.5px] font-semibold sm:text-[11.5px]", subClass ?? "text-slate-500")}>{sub}</p>}
      </div>
    </div>
  );
}

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-6 text-center text-xs text-slate-500", className)}>{children}</p>;
}

/** Bold the numbers inside a generated sentence (keeps the text itself untouched). */
export function EmphasizeNumbers({ text }: { text: string }) {
  const parts = text.split(/(\d[\d,]*(?:\.\d+)?%?)/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-extrabold text-[#0b1f3a]">
            {p}
          </strong>
        ) : (
          p
        )
      )}
    </>
  );
}
