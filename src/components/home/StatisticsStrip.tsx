"use client";

import { motion } from "framer-motion";
import { Users, Landmark, Flag, Lock, FileBarChart } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { formatNumber } from "@/lib/utils";

interface StatisticsStripProps {
  stats: {
    responses: number;
    constituencies: number;
    parties: number;
  };
}

export function StatisticsStrip({ stats }: StatisticsStripProps) {
  const items = [
    { icon: Users, value: stats.responses, suffix: "", primary: null as string | null, label: "कुल वैध प्रतिक्रियाएं" },
    { icon: Landmark, value: stats.constituencies, suffix: "", primary: null as string | null, label: "विधानसभा क्षेत्रों में सर्वे" },
    { icon: Flag, value: stats.parties, suffix: "", primary: null as string | null, label: "मुख्य राजनीतिक दल" },
    { icon: Lock, value: null, suffix: "100%", primary: null as string | null, label: "गोपनीय और सुरक्षित" },
    { icon: FileBarChart, value: null, suffix: "", primary: "तथ्य आधारित", label: "डेटा और विश्लेषण" },
  ];

  return (
    <div className="border-y border-border bg-surface-2">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-border lg:gap-x-4">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex items-center gap-3 lg:pl-4 lg:first:pl-0"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-display text-xl font-extrabold leading-none text-foreground sm:text-2xl">
                    {item.primary ?? (item.value !== null ? <AnimatedCounter value={item.value} /> : item.suffix || formatNumber(0))}
                  </p>
                  <p className="mt-1 text-xs font-medium leading-snug text-muted">{item.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
