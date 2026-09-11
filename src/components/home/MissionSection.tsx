"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function MissionSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-orange-950/20 dark:via-surface dark:to-green-950/20 lg:grid-cols-2 lg:items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="p-8 sm:p-10 lg:p-12"
        >
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">हमारा उद्देश्य</h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            देश के लोकतंत्र को और अधिक मजबूत बनाने के लिए जनता की राय को एक विश्वसनीय और पारदर्शी मंच प्रदान करना।
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            हम किसी भी राजनीतिक दल से स्वतंत्र हैं और तथ्यों पर आधारित विश्लेषण में विश्वास रखते हैं।
          </p>
          <Link
            href="/methodology"
            className="mt-7 inline-flex items-center gap-2 font-semibold text-orange-600 hover:gap-3 transition-all dark:text-orange-400"
          >
            हमारे बारे में जानें <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Right Visual — full-bleed illustrated civic scene, not a small centered icon */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative min-h-[300px] overflow-hidden lg:min-h-[420px] lg:self-stretch"
        >
          <svg viewBox="0 0 480 420" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="55%" stopColor="#fde8c8" />
                <stop offset="100%" stopColor="#f7c58b" />
              </linearGradient>
              <linearGradient id="ms-bldg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a98b5e" />
                <stop offset="100%" stopColor="#7a6240" />
              </linearGradient>
            </defs>
            <rect width="480" height="420" fill="url(#ms-sky)" />
            <circle cx="380" cy="90" r="130" fill="#fff3d6" opacity="0.5" />

            {/* civic building silhouette */}
            <g fill="url(#ms-bldg)">
              <rect x="60" y="230" width="360" height="90" />
              <rect x="40" y="315" width="400" height="14" />
              {Array.from({ length: 9 }).map((_, i) => (
                <rect key={i} x={78 + i * 40} y="250" width="12" height="70" fill="#5f4c30" opacity="0.5" />
              ))}
              <circle cx="240" cy="212" r="42" />
              <rect x="228" y="176" width="24" height="34" />
            </g>
            <rect x="236" y="150" width="8" height="30" fill="#5f4c30" />
            <rect x="238" y="152" width="20" height="6" fill="#FF9933" />
            <rect x="238" y="158" width="20" height="6" fill="#FFFFFF" />
            <rect x="238" y="164" width="20" height="6" fill="#138808" />

            {/* queue of citizens waiting to be heard, generic silhouettes */}
            <g fill="#1c1a22" opacity="0.68">
              {Array.from({ length: 16 }).map((_, i) => {
                const x = 44 + i * 26;
                const s = 0.85 + ((i * 5) % 4) * 0.08;
                return (
                  <g key={i} transform={`translate(${x} 356) scale(${s})`}>
                    <circle cx="0" cy="0" r="8" />
                    <path d="M-7 9 Q0 4 7 9 L9 30 Q0 35 -9 30 Z" />
                  </g>
                );
              })}
            </g>
            <rect x="0" y="360" width="480" height="60" fill="#141119" opacity="0.85" />
          </svg>
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-black/5 to-transparent p-7">
            <p className="font-display text-xl font-bold text-white">जनता की आवाज़</p>
            <p className="text-sm font-medium text-white/90">एक बेहतर भारत के लिए</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
