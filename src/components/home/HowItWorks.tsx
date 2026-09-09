"use client";

import { motion } from "framer-motion";
import { MapPin, Users, BarChart3, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { SectionHeading } from "@/components/home/SectionHeading";

export function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    { icon: MapPin, title: t.home.howItWorks.step1Title, desc: t.home.howItWorks.step1Body },
    { icon: Users, title: t.home.howItWorks.step2Title, desc: t.home.howItWorks.step2Body },
    { icon: BarChart3, title: t.home.howItWorks.step3Title, desc: t.home.howItWorks.step3Body },
    { icon: ShieldCheck, title: t.home.howItWorks.step4Title, desc: t.home.howItWorks.step4Body },
  ];

  return (
    <div>
      <SectionHeading eyebrow="How it works" title={t.home.howItWorks.title} subtitle={t.home.howItWorks.subtitle} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="card-surface rounded-2xl p-6"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink/10 text-ink">
              <s.icon size={18} />
            </div>
            <p className="mt-4 font-display text-sm font-bold text-muted">STEP {i + 1}</p>
            <p className="mt-1 font-semibold">{s.title}</p>
            <p className="mt-1 text-sm text-muted">{s.desc}</p>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">{t.home.howItWorks.note}</p>
    </div>
  );
}
