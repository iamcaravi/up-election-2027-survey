"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, Scale, FileBarChart } from "lucide-react";

export function ResponsibleInitiative() {
  const principles = [
    { icon: Lock, title: "आपकी गोपनीयता हमारी प्राथमिकता" },
    { icon: ShieldCheck, title: "डेटा सुरक्षा और पारदर्शिता" },
    { icon: Scale, title: "किसी भी राजनीतिक दल से स्वतंत्र" },
    { icon: FileBarChart, title: "तथ्यों और आंकड़ों पर आधारित" },
  ];

  return (
    <section className="border-y border-border bg-surface-2">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">एक जिम्मेदार पहल</h2>
            <div className="mt-6 space-y-4">
              {principles.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={i} className="flex items-center gap-3.5 rounded-xl bg-surface p-4 shadow-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
                      <Icon size={18} />
                    </span>
                    <p className="font-semibold text-foreground">{p.title}</p>
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
            className="relative overflow-hidden rounded-2xl"
          >
            <svg viewBox="0 0 480 320" className="h-72 w-full sm:h-80 lg:h-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <linearGradient id="ri-sky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#cfe6f8" />
                  <stop offset="60%" stopColor="#f7dfb4" />
                  <stop offset="100%" stopColor="#f2b982" />
                </linearGradient>
              </defs>
              <rect width="480" height="320" fill="url(#ri-sky)" />
              <circle cx="90" cy="70" r="90" fill="#fff3d6" opacity="0.5" />
              {/* Generic civic gateway monument silhouette */}
              <g fill="#8a6f4f">
                <path d="M180 280 L180 150 Q240 96 300 150 L300 280 Z" />
                <rect x="150" y="274" width="180" height="14" />
              </g>
              <g fill="#6d5638">
                <rect x="192" y="160" width="16" height="110" />
                <rect x="272" y="160" width="16" height="110" />
              </g>
              <rect x="236" y="128" width="8" height="26" fill="#6d5638" />
              <rect x="238" y="130" width="20" height="6" fill="#FF9933" />
              <rect x="238" y="136" width="20" height="6" fill="#FFFFFF" />
              <rect x="238" y="142" width="20" height="6" fill="#138808" />
              {/* trees */}
              <g fill="#2f6b3f" opacity="0.75">
                <circle cx="100" cy="238" r="36" />
                <circle cx="58" cy="254" r="26" />
                <circle cx="400" cy="238" r="36" />
                <circle cx="438" cy="254" r="26" />
              </g>
              {/* small crowd gathered at the base */}
              <g fill="#171420" opacity="0.6">
                {Array.from({ length: 14 }).map((_, i) => {
                  const x = 60 + i * 26;
                  return (
                    <g key={i} transform={`translate(${x} 292) scale(0.85)`}>
                      <circle cx="0" cy="0" r="7" />
                      <path d="M-6 8 Q0 4 6 8 L8 26 Q0 30 -8 26 Z" />
                    </g>
                  );
                })}
              </g>
              <rect x="0" y="274" width="480" height="46" fill="#4c4636" opacity="0.88" />
            </svg>
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/55 via-black/10 to-transparent p-6">
              <p className="font-display text-lg font-bold text-white sm:text-xl">जागरूक नागरिक</p>
              <p className="text-sm font-medium text-white/90">मजबूत लोकतंत्र</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
