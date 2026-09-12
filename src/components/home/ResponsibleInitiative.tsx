"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, Scale, FileBarChart } from "lucide-react";
import Image from "next/image";

export function ResponsibleInitiative() {
  const principles = [
    { icon: Lock, title: "आपकी गोपनीयता हमारी प्राथमिकता" },
    { icon: ShieldCheck, title: "डेटा सुरक्षा और पारदर्शिता" },
    { icon: Scale, title: "किसी भी राजनीतिक दल से स्वतंत्र" },
    { icon: FileBarChart, title: "तथ्यों और आंकड़ों पर आधारित" },
  ];

  return (
    <div className="grid h-full gap-4 overflow-hidden rounded-3xl border border-border bg-surface-2 px-5 py-3.5 sm:px-6 lg:grid-cols-2 lg:items-stretch lg:gap-4 lg:p-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-display text-base font-bold text-foreground sm:text-lg">एक जिम्मेदार पहल</h2>
        <div className="mt-1.5 space-y-1">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-lg bg-surface px-2.5 py-1 shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
                  <Icon size={13} />
                </span>
                <p className="text-xs font-semibold text-foreground sm:text-sm">{p.title}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative h-40 overflow-hidden rounded-2xl sm:h-44 lg:h-full"
      >
        <Image
          src="/images/homepage/responsible-india-gate.jpg"
          alt="इंडिया गेट पर तिरंगे झंडे और आम नागरिक"
          fill
          sizes="(min-width: 1024px) 25vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-ink/15 to-transparent p-4">
          <p className="font-display text-sm font-bold text-white">जागरूक नागरिक</p>
          <p className="text-xs font-medium text-white/90">मजबूत लोकतंत्र</p>
        </div>
      </motion.div>
    </div>
  );
}
