import Link from "next/link";
import { ChartNoAxesColumnIncreasing, ChevronRight, Info, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAVY = "text-[#0b1f3a]";

interface InfoItem {
  href: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  text: string;
  /** Desktop shows the arrow only on the call-to-action item (mobile shows all). */
  primary?: boolean;
}

export function DistrictInfoStrip({
  hi,
  resultsHref,
  participateHref,
}: {
  hi: boolean;
  resultsHref: string;
  participateHref: string;
}) {
  const items: InfoItem[] = [
    {
      href: "/methodology",
      icon: Info,
      tone: "bg-blue-100/80 text-blue-600",
      title: hi ? "सर्वेक्षण के बारे में" : "About the survey",
      text: hi ? "यह डेटा हमारे उपयोगकर्ताओं द्वारा भेजी गई प्रतिक्रियाओं पर आधारित है।" : "This data is based on responses submitted by our users.",
    },
    {
      href: resultsHref,
      icon: ShieldCheck,
      tone: "bg-emerald-100/80 text-emerald-600",
      title: hi ? "जनता की राय" : "Public opinion",
      text: hi ? "अपने क्षेत्र की आवाज़ जानें और तुलना करें।" : "Know your area's voice and compare.",
    },
    {
      href: "/about",
      icon: ChartNoAxesColumnIncreasing,
      tone: "bg-orange-100/80 text-orange-500",
      title: hi ? "पारदर्शी और निष्पक्ष" : "Transparent & neutral",
      text: hi ? "यह एक स्वतंत्र और गैर-राजनीतिक सर्वेक्षण मंच है।" : "An independent, non-political survey platform.",
    },
    {
      href: participateHref,
      icon: Users,
      tone: "bg-violet-100/80 text-violet-600",
      title: hi ? "आप भी भाग लें" : "Take part too",
      text: hi
        ? "अपने विधानसभा क्षेत्र के सर्वेक्षण में हिस्सा लें और बदलाव का हिस्सा बनें।"
        : "Take part in your constituency's survey and be part of the change.",
      primary: true,
    },
  ];

  return (
    <section
      aria-label={hi ? "सर्वेक्षण जानकारी" : "Survey information"}
      className="grid grid-cols-1 gap-2.5 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-slate-200/70 lg:rounded-2xl lg:border lg:border-[#e3e9f4] lg:bg-white lg:px-2 lg:py-3 lg:shadow-[0_6px_18px_-14px_rgba(15,31,75,0.3)]"
    >
      {items.map(({ href, icon: Icon, tone, title, text, primary }) => (
        <Link
          key={title}
          href={href}
          className={cn(
            "group flex items-center gap-3.5 rounded-2xl border border-[#e3e9f4] bg-white p-3.5 shadow-[0_4px_14px_-12px_rgba(15,31,75,0.3)] transition-colors hover:bg-slate-50/80",
            "lg:rounded-none lg:border-0 lg:bg-transparent lg:px-4 lg:py-1.5 lg:shadow-none lg:first:rounded-l-xl lg:last:rounded-r-xl",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          )}
        >
          <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", tone)}>
            <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn("block text-[15px] font-bold leading-snug", NAVY)}>{title}</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{text}</span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white",
              !primary && "lg:hidden"
            )}
          >
            <ChevronRight size={18} />
          </span>
        </Link>
      ))}
    </section>
  );
}
