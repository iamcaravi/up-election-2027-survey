import type { Metadata } from "next";
import Link from "next/link";
import { Users, ShieldCheck, Scale, FileBarChart } from "lucide-react";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "हमारे बारे में",
  description: "votersurvey.in एक स्वतंत्र, स्वैच्छिक जनमत सर्वे मंच है — किसी भी राजनीतिक दल से स्वतंत्र।",
};

const PRINCIPLES = [
  { icon: Users, title: "जनता की भागीदारी", text: "कोई भी अपने विधानसभा क्षेत्र के सर्वे में स्वेच्छा से भाग ले सकता है।" },
  { icon: ShieldCheck, title: "गोपनीयता और सुरक्षा", text: "नाम, फोन नंबर, ईमेल या किसी सरकारी पहचान की मांग नहीं की जाती।" },
  { icon: Scale, title: "राजनीतिक स्वतंत्रता", text: "यह मंच किसी भी राजनीतिक दल, उम्मीदवार या सरकार से संबद्ध नहीं है।" },
  { icon: FileBarChart, title: "तथ्य आधारित विश्लेषण", text: "परिणाम केवल सत्यापित प्रतिक्रियाओं के आधार पर पारदर्शी तरीके से दिखाए जाते हैं।" },
];

export default function AboutPage() {
  return (
    <Container className="max-w-3xl py-14">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">हमारे बारे में</p>
      <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">votersurvey.in</h1>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/90">
        <p>
          देश के लोकतंत्र को और अधिक मजबूत बनाने के लिए जनता की राय को एक विश्वसनीय और पारदर्शी मंच प्रदान करना — यही
          votersurvey.in का उद्देश्य है। हम किसी भी राजनीतिक दल से स्वतंत्र हैं और तथ्यों पर आधारित विश्लेषण में
          विश्वास रखते हैं।
        </p>
        <p>
          यह एक स्वैच्छिक, ऑनलाइन जनमत सर्वे है — इसका किसी चुनाव के आधिकारिक परिणाम से कोई संबंध नहीं है। हर सर्वे
          स्वतंत्र रूप से भरा जाता है और परिणाम केवल सर्वे में भाग लेने वाले लोगों की राय दर्शाते हैं, संपूर्ण मतदाताओं
          की नहीं। विस्तृत जानकारी के लिए हमारी{" "}
          <Link href="/methodology" className="font-semibold text-accent hover:underline">
            पद्धति
          </Link>{" "}
          देखें।
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PRINCIPLES.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
                <Icon size={18} />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-foreground">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{p.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}
