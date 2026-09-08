"use client";

import { motion } from "framer-motion";
import { MapPin, Users, BarChart3, ShieldCheck } from "lucide-react";

const steps = [
  { icon: MapPin, title: "अपना क्षेत्र चुनें", desc: "जिला और विधानसभा क्षेत्र चुनें।" },
  { icon: Users, title: "उम्मीदवार देखें", desc: "घोषित, संभावित और वर्तमान विधायक।" },
  { icon: BarChart3, title: "सर्वे में भाग लें", desc: "एक क्लिक में वोट करें, प्रोफ़ाइल वैकल्पिक है।" },
  { icon: ShieldCheck, title: "परिणाम देखें", desc: "एनोनिमस, एग्रीगेट सर्वे परिणाम तुरंत देखें।" },
];

export function HowItWorks() {
  return (
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
  );
}
