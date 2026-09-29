import { ClipboardList, MapPin, ChartColumn, ChartPie, Settings, CircleQuestionMark } from "lucide-react";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export interface HelpTopic {
  title: string;
  description: string;
  href: string;
  icon: typeof ClipboardList;
  color: string;
}

const TOPICS: Record<Locale, HelpTopic[]> = {
  hi: [
    {
      title: "सर्वेक्षण में भाग लेना",
      description: "कैसे सर्वे करें, कितने सवाल होते हैं, और अपनी राय कैसे दर्ज करें।",
      href: "/find-constituency",
      icon: ClipboardList,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "अपना विधानसभा क्षेत्र खोजना",
      description: "राज्य, जिला और विधानसभा क्षेत्र कैसे चुनें।",
      href: "/find-constituency",
      icon: MapPin,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "परिणाम देखना",
      description: "सर्वेक्षण परिणाम और डेटा को कैसे समझें।",
      href: "/results",
      icon: ChartColumn,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "विश्लेषण समझना",
      description: "विस्तृत विश्लेषण, चार्ट और डेटा की जानकारी।",
      href: "/analysis",
      icon: ChartPie,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "तकनीकी समस्या",
      description: "अगर वेबसाइट सही से काम नहीं कर रही है तो क्या करें।",
      href: "/contact",
      icon: Settings,
      color: "bg-rose-50 text-rose-600",
    },
    {
      title: "अन्य प्रश्न",
      description: "सामान्य जानकारी और अतिरिक्त मदद।",
      href: "/faq",
      icon: CircleQuestionMark,
      color: "bg-sky-50 text-sky-600",
    },
  ],
  en: [
    {
      title: "Taking the Survey",
      description: "How to take the survey, how many questions it has, and how to record your opinion.",
      href: "/find-constituency",
      icon: ClipboardList,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Finding Your Constituency",
      description: "How to choose your state, district, and assembly constituency.",
      href: "/find-constituency",
      icon: MapPin,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Viewing Results",
      description: "How to understand the survey results and data.",
      href: "/results",
      icon: ChartColumn,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Understanding Analysis",
      description: "Detailed analysis, charts, and data insights.",
      href: "/analysis",
      icon: ChartPie,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Technical Issues",
      description: "What to do if the website isn't working correctly.",
      href: "/contact",
      icon: Settings,
      color: "bg-rose-50 text-rose-600",
    },
    {
      title: "Other Questions",
      description: "General information and additional help.",
      href: "/faq",
      icon: CircleQuestionMark,
      color: "bg-sky-50 text-sky-600",
    },
  ],
};

export function getHelpTopics(locale: Locale): HelpTopic[] {
  return TOPICS[locale];
}
