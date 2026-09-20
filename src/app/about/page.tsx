import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, Menu } from "lucide-react";
import { buildPageMetadata } from "@/lib/seo";
import { resolveStaticSeoBase } from "@/lib/seo-catalog";
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import {
  XIcon,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/ui/SocialIcons";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = resolveStaticSeoBase("about", locale);
  return applySeoOverride(
    buildPageMetadata({
      title: base.title,
      description: base.description,
      path: base.path,
    }),
    base.path
  );
}

function IndiaSilhouetteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 89.37 100" fill="#F26B1D" className={className} aria-hidden="true">
      <path d="M28.6 5.3 L29.8 5.4 L32.7 3.7 L34.2 3.7 L34.9 4 L35.3 4.8 L36.2 4.9 L36.4 5.5 L36.8 5 L37.4 5.3 L36.4 7.9 L35.5 8.1 L35.6 8.6 L34.7 8.7 L35 9.4 L34.4 10.2 L32.8 10.3 L33.4 11.4 L32.8 11.5 L32.9 12.3 L33.5 12.8 L34.4 12.9 L34.1 13.5 L34.8 14.6 L33 15.7 L32.5 15.2 L32.3 14.5 L31.3 15.1 L32.5 16.8 L32.5 19.1 L33.4 18.6 L34.4 20 L35.8 20.2 L36.9 20.9 L36.9 21.5 L39.3 22.6 L37.3 24.2 L37.4 24.7 L36.9 25.2 L37.1 26 L36.6 26.3 L36.4 27.3 L37.8 28.2 L37.9 27.7 L39.9 28.8 L40.2 29.5 L40.6 29.5 L42 30.5 L42.5 30.2 L43.7 31 L44.5 30.9 L44.6 31.6 L45.9 31.8 L46.3 32.2 L46.5 31.7 L48 32.1 L48 31.8 L48.9 31.6 L50.3 32.2 L50.4 33.1 L52.1 33.7 L52.1 34.1 L53.4 33.7 L54.1 34.7 L55.6 34.5 L56.8 35.2 L57.8 34.6 L57.9 35.1 L58.6 35.4 L60.3 35 L60.7 35.4 L61.2 34.1 L60.6 32.9 L61.2 30.7 L61 30.3 L62.6 29.6 L63.4 30.5 L63 31.4 L63.4 32.3 L62.9 32.8 L64.1 33.9 L64.9 33.7 L66.3 34.3 L67.8 33.6 L69 34 L71.9 33.9 L72.5 33.5 L73 33.8 L73 32.4 L73.3 32.3 L72.9 31.7 L71.8 31.7 L71.5 31.2 L71.8 30.8 L72.6 30.9 L73.6 30.3 L74.3 30.7 L75.1 30.1 L74.9 29.5 L75.7 29.3 L77.2 27.8 L78.1 27.8 L79.8 26.9 L80.1 26.6 L79.9 26.2 L80.9 25.7 L82.8 26.5 L85.3 25.4 L86 26.1 L85.7 26.6 L86.1 26.3 L87 27.6 L86.3 28.3 L86.6 28.6 L86.6 28.2 L87.3 28 L87.9 28.8 L89.3 29.3 L89.4 29.9 L89.3 30.4 L87.8 31.3 L88.6 33 L87.3 32 L85.8 32.4 L82.5 34.5 L82.2 35.1 L82.6 36.3 L81.7 38 L80.9 38.6 L80.7 39.2 L81.3 39.5 L81.2 40.1 L79.5 43.7 L78.2 43.1 L77.5 43.4 L76.9 42.9 L77.3 44.2 L77.1 46 L76.8 46.4 L76.3 46.3 L76.5 48.9 L75.6 49.9 L75 49.2 L74.7 49.8 L73.7 44.1 L73 44.3 L72.7 44 L72.8 44.9 L72.1 45.5 L72.4 46.2 L71.7 46.7 L71.1 45.5 L70.9 46.1 L70.3 44.4 L71 42.8 L71.6 42.9 L71.9 42.4 L72.1 42.7 L72.1 42.3 L72.6 42.7 L72.6 42.1 L73.4 41.8 L73.8 40.7 L73.6 40.2 L74.4 40.3 L74.2 39.8 L73.1 39.2 L68.1 39.4 L66.3 38.9 L66.4 36.8 L65.8 35.8 L65.5 36.7 L64.8 36.5 L64.2 36.1 L64 35.3 L63.4 35.2 L63.9 35.8 L62.7 35.7 L62.9 35.4 L61.9 34.5 L61.7 35 L62.2 35.4 L61.2 36.1 L61 37.2 L61.5 37.2 L62.3 38.2 L63.1 38.1 L63.7 39 L63.5 39.3 L62 39.2 L61.9 40 L61.1 40.1 L60.7 41 L61.7 41.9 L62.9 42.2 L63 43.2 L62.4 43.6 L62.4 44.3 L63.1 44.8 L62.8 45.6 L63.7 45.7 L63.2 46.4 L64 49.2 L63.7 50.1 L64 50.9 L63.5 51 L63.3 50.5 L63.2 51 L62.9 50.8 L63 49.7 L62.6 49.5 L62.3 50.4 L62 50.1 L62 51 L61.5 50.6 L61.4 51.2 L61.3 49.3 L60.7 49 L61.2 49.4 L60 50.8 L57.9 51.3 L57.3 51.9 L57.1 52.6 L57.5 53.6 L57.2 53.8 L57.8 54 L56.8 54.6 L56.9 55.1 L56.6 55.4 L57 55.2 L55.7 56.5 L53.1 57.3 L51.6 58.3 L48.8 61.9 L47.1 62.9 L46 64.3 L43.2 66.1 L43.2 67.7 L41.4 68.5 L40.1 68.6 L39.1 70.5 L38.3 69.9 L37 70.6 L36.3 72.6 L36.8 74.2 L36.6 75.9 L37.2 78.5 L36.7 81.2 L35.5 83.8 L35.8 88.3 L34 88.4 L32.8 91 L33 91.5 L33.7 91.7 L30.9 92.5 L30.3 94.7 L28.7 95.6 L27.1 94.7 L25.6 92.9 L26 92.6 L25.6 92.8 L25.1 91.4 L24.8 89.2 L23.6 85.6 L22.6 83.7 L21.5 82.7 L20.4 79.9 L20.1 77.3 L19.2 75.2 L19.4 75.3 L18.7 73.8 L17.6 72.5 L17.2 70.7 L16.2 69.4 L15.9 68.3 L16.2 68.2 L15.8 67.8 L16.1 67.9 L15.8 67.6 L16 67.5 L15.8 66.1 L15.4 65.3 L15.7 65.3 L14.6 62.2 L15.1 62.5 L15.1 61.9 L14.5 61.8 L14.5 61.2 L14.8 61.4 L14.4 60.6 L14.6 60.2 L14.8 60.6 L14.5 60 L15 59.6 L14.7 59 L14.2 60 L14.1 58.6 L14.5 58.7 L14 58.1 L14.4 57.9 L14 57.9 L13.7 56.9 L14.6 53.8 L14 53.1 L14.3 52.9 L13.9 52.8 L14.1 52.5 L13.7 52.8 L13.7 52.4 L14 52.4 L13.6 52.1 L14.6 50.8 L13.4 50.9 L14 49.8 L13.3 49.8 L13.5 49.1 L14.5 48.9 L13.4 48.7 L13 49.1 L12.7 48.7 L12.3 49.7 L12.5 50 L12.2 49.9 L12.7 51 L12.1 52.4 L8.1 54.1 L6.1 52.9 L2.4 48.7 L2.8 48.2 L3.3 48.9 L4.1 48.4 L4.6 48.7 L4.8 48.2 L5 48.4 L6.2 48 L7 46.6 L6.3 46.3 L6.3 46.6 L5.3 46.7 L4.7 47.3 L3.2 47 L1.4 45.9 L1.7 46 L1.3 45.7 L1.6 45.5 L0.8 44.8 L2 43.6 L1.1 44 L0.8 43.8 L0.6 44.5 L0 44.4 L0.6 44.1 L0.1 44.1 L0.6 43.2 L1.8 43.3 L2 42.1 L2.2 42.5 L2.4 42.2 L4.4 42.2 L5.7 42.6 L7.3 41.8 L7.4 42.3 L7.8 42.5 L9 41.8 L8.7 41.7 L9 40.9 L7.7 38.6 L7.6 37.6 L6.4 37.5 L5.9 36.8 L6.2 34.8 L4.1 34.1 L4.4 32.7 L6.8 29.9 L7.4 29.9 L8.3 31 L11.4 30.1 L12.9 27.4 L14.6 26.6 L16 23.6 L17.8 22.7 L17.6 21.8 L20 19.9 L19.4 19.7 L19.8 18.7 L19.3 17.7 L19.7 17.2 L22 16.1 L21.2 15.2 L19.9 15.2 L20 14 L19 14.3 L16.7 13.2 L16.6 10.6 L16 9 L16.2 8.3 L16.8 8.4 L17 7.7 L18 7.3 L18.2 6.5 L17.1 6.2 L17.2 5.2 L16 5.2 L15.2 4.5 L15.3 4.1 L13.5 4.1 L13.4 2.9 L14.7 2 L15 1.3 L17.4 1.2 L16.8 0.6 L18 0.9 L20 0 L20.6 0.5 L21.3 0.2 L22.2 0.5 L22.3 1.2 L23.2 1.1 L24 2.2 L26.2 3.1 L26.5 4.1 L28.1 4.5 L28.6 5.3 Z M78.5 98.4 L78.9 99.2 L78.5 100 L78 98.8 L78.5 98.4 Z M74.6 86.4 L74.6 87.4 L74.1 87.6 L74.1 86.7 L74.6 86.4 Z M75 82 L75.3 83 L75.1 84.4 L74.5 83.2 L74.6 82.9 L74.8 83.2 L75 82 Z M75.7 79.7 L75.9 81.1 L75.4 81.2 L75.6 81.7 L75.2 81.7 L75.1 80 L75.7 79.7 Z M76.1 77.6 L76.2 78.3 L75.8 78.3 L76.2 78.5 L76.1 79.2 L75.6 79.1 L75.8 79.5 L75.4 79.8 L75.5 78.1 L76.1 77.6 Z" />
    </svg>
  );
}

function ShieldStarDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <path d="M216 48 128 32 40 48v72c0 60 40 100 88 112 48-12 88-52 88-112V48Z" fill="#2347C5" fillOpacity="0.18" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m128 76 11.5 23.3 25.7 3.7-18.6 18.2 4.4 25.6L128 134.7l-23 12.1 4.4-25.6-18.6-18.2 25.7-3.7L128 76Z" fill="#D0161F" stroke="#D0161F" strokeWidth="4" strokeLinejoin="round"/>
    </svg>
  );
}

function UsersThreeDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <path d="M128 144c-35.35 0-64 21.5-64 48v24h128v-24c0-26.5-28.65-48-64-48Z" fill="#2347C5" fillOpacity="0.2"/>
      <circle cx="128" cy="80" r="40" fill="#2347C5" fillOpacity="0.2"/>
      <path d="M128 144c-35.35 0-64 21.5-64 48v24h128v-24c0-26.5-28.65-48-64-48Z" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="128" cy="80" r="40" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M60.6 156.4A52.2 52.2 0 0 0 24 192v24h40" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M72 108a32 32 0 1 1 0-64 32.7 32.7 0 0 1 16.4 4.4" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M195.4 156.4A52.2 52.2 0 0 1 232 192v24h-40" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M184 108a32 32 0 1 0 0-64 32.7 32.7 0 0 0-16.4 4.4" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BankDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <path d="M24 104 128 40l104 64H24Z" fill="#2347C5" fillOpacity="0.2"/>
      <path d="M24 104 128 40l104 64H24Z" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="216" x2="240" y2="216" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="32" y1="184" x2="224" y2="184" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="56" y1="104" x2="56" y2="184" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="104" y1="104" x2="104" y2="184" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="152" y1="104" x2="152" y2="184" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="200" y1="104" x2="200" y2="184" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChartBarDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <rect x="88" y="128" width="36" height="80" rx="4" fill="#2347C5" fillOpacity="0.2" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="144" y="80" width="36" height="128" rx="4" fill="#2347C5" fillOpacity="0.2" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="200" y="40" width="36" height="168" rx="4" fill="#2347C5" fillOpacity="0.2" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="32" y="168" width="36" height="40" rx="4" fill="#2347C5" fillOpacity="0.2" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="216" x2="248" y2="216" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TargetDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <circle cx="128" cy="128" r="96" fill="#D0161F" fillOpacity="0.18" stroke="#D0161F" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="128" cy="128" r="60" stroke="#D0161F" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="128" cy="128" r="24" fill="#D0161F"/>
    </svg>
  );
}

function LockDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <rect x="40" y="96" width="176" height="128" rx="16" fill="#2347C5" fillOpacity="0.2" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M80 96V64a48 48 0 0 1 96 0v32" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="128" cy="152" r="14" fill="#2347C5"/>
      <line x1="128" y1="166" x2="128" y2="186" stroke="#2347C5" strokeWidth="14" strokeLinecap="round"/>
    </svg>
  );
}

function ScalesDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <path d="M28 176c0 17.7 21.5 32 48 32s48-14.3 48-32H28Z" fill="#2347C5" fillOpacity="0.2"/>
      <path d="M132 176c0 17.7 21.5 32 48 32s48-14.3 48-32h-96Z" fill="#2347C5" fillOpacity="0.2"/>
      <line x1="128" y1="40" x2="128" y2="216" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="96" y1="216" x2="160" y2="216" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="40" y1="88" x2="216" y2="88" stroke="#2347C5" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40 88 28 176h96L76 88" stroke="#2347C5" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M180 88 132 176h96l-48-88" stroke="#2347C5" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="128" cy="40" r="10" fill="#2347C5"/>
    </svg>
  );
}

function LeafDuotone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="none" className={className} aria-hidden="true">
      <path d="M208 48C132 48 64 104 64 168a48 48 0 0 0 48 48c64 0 120-68 120-144v-24h-24Z" fill="#16A34A" fillOpacity="0.2"/>
      <path d="M208 48C132 48 64 104 64 168a48 48 0 0 0 48 48c64 0 120-68 120-144v-24h-24Z" stroke="#16A34A" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40 216c32-40 64-72 120-120" stroke="#16A34A" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RedBrushUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 8C35 2 95 1 198 6.5C150 12 80 13 2 8Z"
        fill="#D0161F"
        opacity="0.92"
      />
      <path
        d="M5 9.5C50 4.5 110 3.5 196 8C148 11.5 75 11 5 9.5Z"
        fill="#D0161F"
        opacity="0.45"
      />
    </svg>
  );
}

const CONTENT = {
  en: {
    nav: {
      home: "Home",
      survey: "Survey",
      results: "Results",
      news: "News & Insights",
      about: "About",
      contact: "Contact",
      searchPlaceholder: "Search state or constituency...",
      takeSurvey: "Take Survey",
    },
    hero: {
      eyebrow: "ABOUT US",
      title1: "A Platform for",
      title2: "People, ",
      titleAccent: "Not Politics",
      description:
        "Votersurvey.in is an independent, non-partisan platform that gives every Indian a voice. We believe a stronger democracy is built when people are informed, aware, and actively participate in the political process.",
      takeSurveyCta: "Take Survey Now",
      exploreResultsCta: "Explore Results",
    },
    stats: {
      stat1Val: "2.5L+",
      stat1Label: "People Participated",
      stat2Val: "28",
      stat2Label: "States & 8 UTs",
      stat3Val: "800+",
      stat3Label: "Constituencies Covered",
      stat4Val: "100%",
      stat4Label: "Independent & Anonymous",
    },
    mission: {
      title: "Our Mission",
      description:
        "To empower every citizen with a safe, transparent, and non-partisan platform to express their political opinions, explore real-time insights, and contribute to a more informed and participative democracy.",
      pillar1Title: "People First",
      pillar1Desc: "Your opinion matters",
      pillar2Title: "Non-Partisan",
      pillar2Desc: "No political affiliation",
      pillar3Title: "Data-Driven",
      pillar3Desc: "Real insights from real people",
      pillar4Title: "Stronger India",
      pillar4Desc: "An informed electorate",
    },
    story: {
      title: "Our Story",
      p1: "Votersurvey.in was founded with a simple idea — to create a neutral platform where every Indian, from metro cities to small towns, can share their political views without fear or bias.",
      p2: "In a time when information is scattered and often influenced, we wanted to bring authentic, people-driven insights together in one place. Today, Votersurvey.in is growing into India's largest independent political survey platform, thanks to millions of citizens who believe that their voice matters.",
      mobileSummary:
        "A neutral platform for every Indian to share their views and build a more informed democracy.",
      cta: "Read Our Blog",
    },
    values: {
      title: "Our Values",
      v1Title: "Privacy",
      v1Desc: "Your data is safe and anonymous.",
      v2Title: "Integrity",
      v2Desc: "We remain neutral and unbiased.",
      v3Title: "Inclusivity",
      v3Desc: "Every voice matters, from every region.",
      v4Title: "Positive Impact",
      v4Desc: "Insights for a stronger, healthier democracy.",
    },
    ctaBanner: {
      titleLine1: "Be the Voice",
      titleLine2: "for a Better India",
      tagline:
        "Join millions of Indians who are shaping a stronger tomorrow.",
      button: "Take Survey Now",
    },
    footer: {
      tagline: "People. Opinions. A Stronger India.",
      rights: "© 2026 Votersurvey.in. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Use",
    },
  },
  hi: {
    nav: {
      home: "मुख्य पृष्ठ",
      survey: "सर्वे",
      results: "परिणाम",
      news: "समाचार व विश्लेषण",
      about: "हमारे बारे में",
      contact: "संपर्क",
      searchPlaceholder: "राज्य या विधानसभा खोजें...",
      takeSurvey: "सर्वे में भाग लें",
    },
    hero: {
      eyebrow: "हमारे बारे में",
      title1: "जनता का मंच,",
      title2: " ",
      titleAccent: "राजनीति का नहीं",
      description:
        "votersurvey.in एक स्वतंत्र और निष्पक्ष मंच है जो हर भारतीय नागरिक को आवाज़ देता है। हमारा मानना है कि लोकतंत्र तभी सशक्त होता है जब लोग जागरूक, सूचित हों और लोकतांत्रिक प्रक्रिया में सक्रिय भागीदारी करें।",
      takeSurveyCta: "सर्वे में भाग लें",
      exploreResultsCta: "परिणाम देखें",
    },
    stats: {
      stat1Val: "2.5L+",
      stat1Label: "नागरिकों की भागीदारी",
      stat2Val: "28",
      stat2Label: "राज्य व 8 UT",
      stat3Val: "800+",
      stat3Label: "विधानसभा क्षेत्र",
      stat4Val: "100%",
      stat4Label: "स्वतंत्र व गोपनीय",
    },
    mission: {
      title: "हमारा उद्देश्य",
      description:
        "हर नागरिक को अपनी राय व्यक्त करने, वास्तविक डेटा को समझने और एक सशक्त, जागरूक लोकतंत्र के निर्माण में योगदान के लिए एक सुरक्षित, पारदर्शी और निष्पक्ष मंच प्रदान करना।",
      pillar1Title: "नागरिक प्रथम",
      pillar1Desc: "आपकी राय महत्वपूर्ण है",
      pillar2Title: "पूर्णतः निष्पक्ष",
      pillar2Desc: "किसी भी राजनीतिक दल से असंबद्ध",
      pillar3Title: "डेटा आधारित",
      pillar3Desc: "सत्यापित वास्तविक जनमत",
      pillar4Title: "सशक्त भारत",
      pillar4Desc: "एक जागरूक व सशक्त राष्ट्र",
    },
    story: {
      title: "हमारी कहानी",
      p1: "votersurvey.in की स्थापना एक सरल विचार के साथ हुई — एक ऐसा निष्पक्ष मंच बनाना जहाँ महानगरों से लेकर छोटे कस्बों तक का हर भारतीय बिना किसी डर या पूर्वाग्रह के अपनी बात रख सके।",
      p2: "ऐसे समय में जब जानकारी बिखरी हुई और प्रभावित होती है, हम प्रामाणिक जन-आधारित अंतर्दृष्टि को एक साथ लाना चाहते थे। आज यह मंच भारत का सबसे बड़ा स्वतंत्र जनमत सर्वेक्षण मंच बन रहा है।",
      mobileSummary:
        "हर भारतीय के लिए एक निष्पक्ष मंच जहाँ वे अपने विचार साझा कर एक मजबूत लोकतंत्र बना सकें।",
      cta: "हमारी कार्यपद्धति पढ़ें",
    },
    values: {
      title: "हमारे मूल्य",
      v1Title: "गोपनीयता",
      v1Desc: "आपका डेटा सुरक्षित और गोपनीय है।",
      v2Title: "सत्यनिष्ठा",
      v2Desc: "हम निष्पक्ष और तटस्थ रहते हैं।",
      v3Title: "समानता",
      v3Desc: "हर क्षेत्र से हर आवाज़ का महत्व।",
      v4Title: "सकारात्मक प्रभाव",
      v4Desc: "एक स्वस्थ और सशक्त लोकतंत्र के लिए।",
    },
    ctaBanner: {
      titleLine1: "सशक्त भारत के निर्माण में",
      titleLine2: "अपनी आवाज़ जोड़ें",
      tagline: "लाखों भारतीयों के साथ जुड़ें जो एक बेहतर कल का निर्माण कर रहे हैं।",
      button: "सर्वे में भाग लें",
    },
    footer: {
      tagline: "जनता। जनमत। एक सशक्त भारत।",
      rights: "© 2026 Votersurvey.in. सर्वाधिकार सुरक्षित।",
      privacy: "गोपनीयता नीति",
      terms: "उपयोग की शर्तें",
    },
  },
};

export default async function AboutPage({
  searchParams,
}: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const cookieLocale = await getServerLocale();
  const locale =
    resolvedParams?.lang === "en" || resolvedParams?.lang === "hi"
      ? resolvedParams.lang
      : cookieLocale;
  const c = CONTENT[locale];

  return (
    <div
      data-about-page="true"
      className="min-h-screen overflow-x-clip bg-white text-[#0B1536] font-sans antialiased selection:bg-rose-500/20 selection:text-rose-700"
    >
      {/* Scoped CSS override to hide global multi-page header/footer ONLY on /about */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            body:has([data-about-page="true"]) [data-section="header"],
            body:has([data-about-page="true"]) [data-section="footer"] {
              display: none !important;
            }
            body:has([data-about-page="true"]) {
              overflow-x: hidden !important;
              max-width: 100% !important;
            }
            html:has([data-about-page="true"]) {
              overflow-x: hidden !important;
              max-width: 100% !important;
            }
            nextjs-portal, [data-nextjs-dev-tools-indicator], [data-next-badge], #next-dev-tools {
              display: none !important;
            }
          `,
        }}
      />

      {/* ========================================================= */}
      {/* 1. HEADER (DESKTOP + MOBILE) — REFERENCE REPRODUCTION     */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xs border-b border-slate-100">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          {/* Desktop Header Row (h-[52px] - wide, tight & vertically compact matching reference) */}
          <div className="hidden lg:flex h-[52px] items-center justify-between">
            {/* Left Group: Logo + Navigation */}
            <div className="flex items-center gap-8 xl:gap-11">
              {/* Logo */}
              <Link href="/" className="flex flex-col shrink-0 leading-none group">
                <span className="font-sans text-[20px] font-extrabold tracking-[-0.02em] flex items-baseline">
                  <span className="text-[#0F1B3D]">VOTER</span>
                  <span className="text-[#D0161F]">SURVEY</span>
                  <span className="text-[#0F1B3D] text-[15.5px] font-bold">.in</span>
                </span>
                <span className="font-sans text-[8.5px] font-normal text-slate-400 mt-[2px] tracking-[0.02em]">
                  {c.footer.tagline}
                </span>
              </Link>

              {/* Nav links */}
              <nav className="flex items-center gap-5 xl:gap-6 font-sans text-[13px] font-medium text-slate-600">
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  {c.nav.home}
                </Link>
                <Link
                  href="/find-constituency"
                  className="hover:text-blue-600 transition-colors"
                >
                  {c.nav.survey}
                </Link>
                <Link
                  href="/results"
                  className="hover:text-blue-600 transition-colors"
                >
                  {c.nav.results}
                </Link>
                <Link
                  href="/analysis"
                  className="hover:text-blue-600 transition-colors"
                >
                  {c.nav.news}
                </Link>
                <span className="relative font-bold text-[#2347C5] cursor-default py-0.5">
                  {c.nav.about}
                  <span className="absolute -bottom-[5px] left-0 right-0 h-[2.5px] bg-[#2347C5] rounded-[1px]" />
                </span>
                <Link
                  href="/contact"
                  className="hover:text-blue-600 transition-colors"
                >
                  {c.nav.contact}
                </Link>
              </nav>
            </div>

            {/* Right Group: Search Box + Take Survey CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={c.nav.searchPlaceholder}
                  className="w-48 xl:w-56 h-[32px] rounded-full border border-slate-200 bg-white py-0 pl-3.5 pr-8 font-sans text-[12px] text-slate-600 placeholder:text-slate-400 shadow-2xs focus:border-blue-500 focus:outline-none"
                  readOnly
                />
                <Search className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#0F1B3D] stroke-[2.2] pointer-events-none" />
              </div>

              {/* Take Survey Red CTA */}
              <Link
                href="/find-constituency"
                className="h-[32px] px-4 rounded-[6px] bg-[#D0161F] font-sans text-white text-[12px] font-bold shadow-2xs hover:bg-[#B91C1C] transition-colors inline-flex items-center justify-center tracking-[0.01em] leading-none"
              >
                {c.nav.takeSurvey}
              </Link>
            </div>
          </div>

          {/* Mobile Header Row (h-[48px] - left aligned hamburger + logo, right search + CTA) */}
          <div className="flex lg:hidden h-[48px] items-center justify-between">
            {/* Left group: Hamburger + Logo side-by-side */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="p-1 text-[#0F1B3D] -ml-1"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5 stroke-[2.4]" />
              </button>

              <Link href="/" className="flex flex-col leading-none">
                <span className="font-sans text-[16px] font-extrabold tracking-[-0.015em] flex items-baseline">
                  <span className="text-[#0F1B3D]">VOTER</span>
                  <span className="text-[#D0161F]">SURVEY</span>
                  <span className="text-[#0F1B3D] text-[13px] font-bold">.in</span>
                </span>
                <span className="font-sans text-[7.2px] font-medium text-slate-400 mt-[1.5px] tracking-[0.01em]">
                  {c.footer.tagline}
                </span>
              </Link>
            </div>

            {/* Right group: Search Icon + Compact Red CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/find-constituency" aria-label="Search" className="p-1 text-[#0F1B3D]">
                <Search className="h-4 w-4 stroke-[2.4]" />
              </Link>
              <Link
                href="/find-constituency"
                className="h-[28px] px-3 rounded-[6px] bg-[#D0161F] font-sans text-[11px] font-bold text-white shadow-2xs inline-flex items-center justify-center shrink-0"
              >
                {c.nav.takeSurvey}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION — EXACT REFERENCE COMPOSITION             */}
      {/* ========================================================= */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#F0F4FD] via-white to-white">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center min-h-[410px] relative">
            {/* Left Content */}
            <div className="w-[50%] max-w-[560px] z-10 py-8">
              <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#5E6E8F]">
                {c.hero.eyebrow}
              </div>

              <h1 className="mt-3 font-sans text-[44px] xl:text-[48px] font-extrabold leading-[1.12] text-[#0F1B3D] tracking-[-0.025em]">
                {c.hero.title1} <br />
                {c.hero.title2}
                <span className="text-[#2347C5]">{c.hero.titleAccent}</span>
              </h1>

              <p className="mt-4 text-[14.5px] leading-[1.65] text-[#5B6577] max-w-[440px]">
                {c.hero.description}
              </p>

              <div className="mt-7 flex items-center gap-3.5">
                <Link
                  href="/find-constituency"
                  className="h-[42px] px-6 rounded-[8px] bg-[#D0161F] hover:bg-[#B91C1C] text-white text-[13px] font-bold shadow-xs inline-flex items-center gap-2 transition-colors"
                >
                  <span>{c.hero.takeSurveyCta}</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </Link>

                <Link
                  href="/results"
                  className="h-[42px] px-6 rounded-[8px] border-2 border-[#2347C5] bg-white text-[#2347C5] hover:bg-blue-50/50 text-[13px] font-bold shadow-2xs inline-flex items-center gap-2 transition-colors"
                >
                  <ChartBarDuotone className="h-4 w-4" />
                  <span>{c.hero.exploreResultsCta}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="block lg:hidden space-y-3.5 pt-3 pb-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5E6E8F]">
              {c.hero.eyebrow}
            </div>

            <h1 className="font-sans text-[26px] font-extrabold leading-[1.15] text-[#0F1B3D] tracking-tight">
              {c.hero.title1} <br />
              {c.hero.title2}
              <span className="text-[#2347C5]">{c.hero.titleAccent}</span>
            </h1>

            <p className="text-[12.5px] leading-relaxed text-[#5B6577]">
              {c.hero.description}
            </p>

            {/* 2 buttons side by side */}
            <div className="flex items-center gap-2.5 pt-1">
              <Link
                href="/find-constituency"
                className="flex-1 h-10 rounded-[8px] bg-[#D0161F] text-white text-[11.5px] font-bold inline-flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>{c.hero.takeSurveyCta}</span>
                <ArrowRight className="h-3 w-3 stroke-[2.5]" />
              </Link>

              <Link
                href="/results"
                className="flex-1 h-10 rounded-[8px] border-2 border-[#2347C5] bg-white text-[#2347C5] text-[11.5px] font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <ChartBarDuotone className="h-3.5 w-3.5" />
                <span>{c.hero.exploreResultsCta}</span>
              </Link>
            </div>

            {/* India Gate visual below buttons on mobile */}
            <div className="relative w-full aspect-[862/448] overflow-hidden rounded-xl bg-slate-50 mt-4">
              <Image
                src="/images/about-hero-gate.png"
                alt="India Gate with Citizens - Janta ki Awaaz Desh ki Taqat"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
          </div>
        </div>

        {/* Desktop Hero Image Bleed to Right Window Edge */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[55vw] min-w-[720px] max-w-[850px] pointer-events-none z-0">
          <div className="relative w-full h-full">
            <Image
              src="/images/about-hero-gate.png"
              alt="India Gate with Citizens - Janta ki Awaaz Desh ki Taqat"
              fill
              priority
              className="object-contain object-right"
              sizes="850px"
            />
            {/* Left gradient blend */}
            <div
              className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-[#F0F4FD] via-[#F0F4FD]/70 to-transparent pointer-events-none"
              aria-hidden="true"
            />
            {/* Bottom gradient fade */}
            <div
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/60 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* MAIN CONTENT WRAPPER                                      */}
      {/* ========================================================= */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-12 space-y-6 sm:space-y-8">
        {/* ========================================================= */}
        {/* 3. STATISTICS STRIP — SINGLE WHITE/LIGHT BAR CONTAINER    */}
        {/* ========================================================= */}
        <section>
          {/* Desktop: 4 columns in a single row with subtle vertical divider lines */}
          <div className="hidden lg:grid lg:grid-cols-4 rounded-2xl border border-[#E1E8F4] bg-[#EEF3FB]/75 backdrop-blur-xs px-8 py-5 shadow-xs divide-x divide-[#E1E8F4]">
            {/* Item 1 */}
            <div className="flex items-center gap-4 pr-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                <UsersThreeDuotone className="h-[44px] w-[44px]" />
              </div>
              <div>
                <div className="font-sans text-[28px] font-black text-[#0F1B3D] leading-none">
                  {c.stats.stat1Val}
                </div>
                <div className="text-[12px] font-medium text-[#5B6577] mt-1">
                  {c.stats.stat1Label}
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                <IndiaSilhouetteIcon className="h-[44px] w-auto" />
              </div>
              <div>
                <div className="font-sans text-[28px] font-black text-[#0F1B3D] leading-none">
                  {c.stats.stat2Val}
                </div>
                <div className="text-[12px] font-medium text-[#5B6577] mt-1">
                  {c.stats.stat2Label}
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 px-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                <BankDuotone className="h-[44px] w-[44px]" />
              </div>
              <div>
                <div className="font-sans text-[28px] font-black text-[#0F1B3D] leading-none">
                  {c.stats.stat3Val}
                </div>
                <div className="text-[12px] font-medium text-[#5B6577] mt-1">
                  {c.stats.stat3Label}
                </div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-4 pl-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                <ChartBarDuotone className="h-[44px] w-[44px]" />
              </div>
              <div>
                <div className="font-sans text-[28px] font-black text-[#0F1B3D] leading-none">
                  {c.stats.stat4Val}
                </div>
                <div className="text-[12px] font-medium text-[#5B6577] mt-1">
                  {c.stats.stat4Label}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: 2x2 grid inside a single card container with dividers */}
          <div className="grid lg:hidden grid-cols-2 rounded-xl border border-[#E1E8F4] bg-[#EEF3FB]/75 p-3.5 shadow-2xs divide-x divide-[#E1E8F4]">
            {/* Col 1 */}
            <div className="space-y-3.5 pr-3.5">
              {/* Top Left */}
              <div className="flex items-center gap-2.5">
                <UsersThreeDuotone className="h-7 w-7 shrink-0" />
                <div>
                  <div className="font-sans text-[17px] font-black text-[#0F1B3D] leading-none">
                    {c.stats.stat1Val}
                  </div>
                  <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                    {c.stats.stat1Label}
                  </div>
                </div>
              </div>

              {/* Bottom Left */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#E1E8F4]">
                <BankDuotone className="h-7 w-7 shrink-0" />
                <div>
                  <div className="font-sans text-[17px] font-black text-[#0F1B3D] leading-none">
                    {c.stats.stat3Val}
                  </div>
                  <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                    {c.stats.stat3Label}
                  </div>
                </div>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-3.5 pl-3.5">
              {/* Top Right */}
              <div className="flex items-center gap-2.5">
                <IndiaSilhouetteIcon className="h-7 w-auto shrink-0" />
                <div>
                  <div className="font-sans text-[17px] font-black text-[#0F1B3D] leading-none">
                    {c.stats.stat2Val}
                  </div>
                  <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                    {c.stats.stat2Label}
                  </div>
                </div>
              </div>

              {/* Bottom Right */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-[#E1E8F4]">
                <ChartBarDuotone className="h-7 w-7 shrink-0" />
                <div>
                  <div className="font-sans text-[17px] font-black text-[#0F1B3D] leading-none">
                    {c.stats.stat4Val}
                  </div>
                  <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                    {c.stats.stat4Label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. OUR MISSION SECTION                                    */}
        {/* ========================================================= */}
        <section>
          {/* Desktop Layout: 2 columns (Flag visual on left, text & 4 pillars on right) */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:items-center gap-10">
            {/* Left Image with Flag */}
            <div className="lg:col-span-5 relative h-[300px] w-full overflow-hidden rounded-2xl">
              <Image
                src="/images/about-mission-flag.png"
                alt="Citizens waving Indian Flag - A Stronger India Together"
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 40vw, 500px"
              />
              <div
                className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"
                aria-hidden="true"
              />
            </div>

            {/* Right Text & 4-Pillars in 1 horizontal row */}
            <div className="lg:col-span-7">
              <h2 className="font-sans text-[28px] font-extrabold text-[#0F1B3D] tracking-tight">
                {c.mission.title}
              </h2>

              <p className="mt-3 text-[14px] leading-relaxed text-[#5B6577] max-w-xl">
                {c.mission.description}
              </p>

              {/* 4 Pillars in a single row with subtle vertical divider lines */}
              <div className="mt-8 grid grid-cols-4 divide-x divide-[#E1E8F4]">
                <div className="text-center pr-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center">
                    <UsersThreeDuotone className="h-[40px] w-[40px]" />
                  </div>
                  <div className="mt-2 font-sans text-[13px] font-bold text-[#0F1B3D]">
                    {c.mission.pillar1Title}
                  </div>
                  <div className="text-[11px] text-[#5B6577] mt-0.5 max-w-[110px] mx-auto">
                    {c.mission.pillar1Desc}
                  </div>
                </div>

                <div className="text-center px-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center">
                    <ShieldStarDuotone className="h-[40px] w-[40px]" />
                  </div>
                  <div className="mt-2 font-sans text-[13px] font-bold text-[#0F1B3D]">
                    {c.mission.pillar2Title}
                  </div>
                  <div className="text-[11px] text-[#5B6577] mt-0.5 max-w-[110px] mx-auto">
                    {c.mission.pillar2Desc}
                  </div>
                </div>

                <div className="text-center px-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center">
                    <ChartBarDuotone className="h-[40px] w-[40px]" />
                  </div>
                  <div className="mt-2 font-sans text-[13px] font-bold text-[#0F1B3D]">
                    {c.mission.pillar3Title}
                  </div>
                  <div className="text-[11px] text-[#5B6577] mt-0.5 max-w-[110px] mx-auto">
                    {c.mission.pillar3Desc}
                  </div>
                </div>

                <div className="text-center pl-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center">
                    <TargetDuotone className="h-[40px] w-[40px]" />
                  </div>
                  <div className="mt-2 font-sans text-[13px] font-bold text-[#0F1B3D]">
                    {c.mission.pillar4Title}
                  </div>
                  <div className="text-[11px] text-[#5B6577] mt-0.5 max-w-[110px] mx-auto">
                    {c.mission.pillar4Desc}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout: Title, Description, and 2x2 Pillars Grid (Flag image omitted per reference) */}
          <div className="block lg:hidden space-y-3">
            <h2 className="font-sans text-xl font-bold text-[#0F1B3D]">
              {c.mission.title}
            </h2>

            <p className="text-xs leading-relaxed text-[#5B6577]">
              {c.mission.description}
            </p>

            {/* 2x2 Pillars Grid with clean dividers */}
            <div className="grid grid-cols-2 rounded-xl border border-[#E1E8F4] bg-[#EEF3FB]/75 p-3.5 shadow-2xs divide-x divide-[#E1E8F4] mt-3">
              {/* Col 1 */}
              <div className="space-y-3.5 pr-3">
                <div className="flex items-center gap-2.5">
                  <UsersThreeDuotone className="h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-sans text-xs font-bold text-[#0F1B3D]">
                      {c.mission.pillar1Title}
                    </div>
                    <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                      {c.mission.pillar1Desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t border-[#E1E8F4]">
                  <ChartBarDuotone className="h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-sans text-xs font-bold text-[#0F1B3D]">
                      {c.mission.pillar3Title}
                    </div>
                    <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                      {c.mission.pillar3Desc}
                    </div>
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="space-y-3.5 pl-3">
                <div className="flex items-center gap-2.5">
                  <ShieldStarDuotone className="h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-sans text-xs font-bold text-[#0F1B3D]">
                      {c.mission.pillar2Title}
                    </div>
                    <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                      {c.mission.pillar2Desc}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t border-[#E1E8F4]">
                  <TargetDuotone className="h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-sans text-xs font-bold text-[#0F1B3D]">
                      {c.mission.pillar4Title}
                    </div>
                    <div className="text-[10px] text-[#5B6577] leading-tight mt-0.5">
                      {c.mission.pillar4Desc}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. OUR STORY SECTION                                      */}
        {/* ========================================================= */}
        <section>
          {/* Desktop Wide Editorial Card with friends visual on right */}
          <div className="hidden lg:block rounded-2xl border border-[#E1E8F4] bg-[#EEF3FB]/75 p-8 relative overflow-hidden shadow-2xs min-h-[300px]">
            <div className="w-[44%] z-10 relative py-1">
              <h2 className="font-sans text-[28px] font-extrabold text-[#0F1B3D] tracking-tight">
                {c.story.title}
              </h2>

              <div className="mt-3.5 space-y-3 text-[14px] leading-relaxed text-[#5B6577] max-w-[420px]">
                <p>{c.story.p1}</p>
                <p>{c.story.p2}</p>
              </div>

              <div className="mt-6">
                <Link
                  href="/methodology"
                  className="inline-flex items-center gap-2 rounded-[8px] border-2 border-[#2347C5] bg-white px-5 py-2 text-xs font-bold text-[#2347C5] shadow-2xs hover:bg-blue-50/50 transition-colors"
                >
                  <span>{c.story.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </Link>
              </div>
            </div>

            {/* Right Story Visual filling right side of card */}
            <div className="absolute right-0 top-0 bottom-0 w-[58%] h-full pointer-events-none">
              <Image
                src="/images/about-story-group.png"
                alt="Friends overlooking city - Better Conversations Brighter Tomorrows"
                fill
                className="object-cover object-right-top"
                sizes="(max-width: 1200px) 55vw, 700px"
              />
              <div
                className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#EEF3FB] to-transparent pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Mobile Story Compact Card */}
          <div className="block lg:hidden">
            <Link
              href="/methodology"
              className="flex items-center gap-3.5 rounded-xl border border-[#E1E8F4] bg-[#EEF3FB]/75 p-3.5 shadow-2xs active:scale-[0.99] transition-transform"
            >
              {/* Thumbnail */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                <Image
                  src="/images/about-story-thumb.png"
                  alt="Our Story Thumbnail"
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="font-sans text-sm font-bold text-[#0F1B3D]">
                  {c.story.title}
                </div>
                <div className="text-[11px] text-[#5B6577] leading-snug mt-0.5">
                  {c.story.mobileSummary}
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. OUR VALUES SECTION                                     */}
        {/* ========================================================= */}
        <section>
          {/* Desktop Values: 4 columns in 1 row */}
          <div className="hidden lg:block">
            <h2 className="font-sans text-[28px] font-extrabold text-[#0F1B3D] tracking-tight mb-5">
              {c.values.title}
            </h2>

            <div className="grid grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white p-4 shadow-2xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <LockDuotone className="h-[36px] w-[36px]" />
                </div>
                <div>
                  <div className="font-sans text-[15px] font-bold text-[#0F1B3D]">
                    {c.values.v1Title}
                  </div>
                  <div className="text-[12px] text-[#5B6577] leading-snug mt-0.5">
                    {c.values.v1Desc}
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white p-4 shadow-2xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <ScalesDuotone className="h-[36px] w-[36px]" />
                </div>
                <div>
                  <div className="font-sans text-[15px] font-bold text-[#0F1B3D]">
                    {c.values.v2Title}
                  </div>
                  <div className="text-[12px] text-[#5B6577] leading-snug mt-0.5">
                    {c.values.v2Desc}
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white p-4 shadow-2xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <UsersThreeDuotone className="h-[36px] w-[36px]" />
                </div>
                <div>
                  <div className="font-sans text-[15px] font-bold text-[#0F1B3D]">
                    {c.values.v3Title}
                  </div>
                  <div className="text-[12px] text-[#5B6577] leading-snug mt-0.5">
                    {c.values.v3Desc}
                  </div>
                </div>
              </div>

              {/* Card 4 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white p-4 shadow-2xs flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <LeafDuotone className="h-[36px] w-[36px]" />
                </div>
                <div>
                  <div className="font-sans text-[15px] font-bold text-[#0F1B3D]">
                    {c.values.v4Title}
                  </div>
                  <div className="text-[12px] text-[#5B6577] leading-snug mt-0.5">
                    {c.values.v4Desc}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Values: 4 compact cards in 1 row (no descriptions per reference) */}
          <div className="block lg:hidden">
            <h2 className="font-sans text-lg font-bold text-[#0F1B3D] mb-3">
              {c.values.title}
            </h2>

            <div className="grid grid-cols-4 gap-2">
              {/* V1 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white py-3 px-1 flex flex-col items-center justify-center text-center shadow-2xs">
                <LockDuotone className="h-7 w-7" />
                <div className="font-sans text-[11px] font-bold text-[#0F1B3D] mt-1.5">
                  {c.values.v1Title}
                </div>
              </div>

              {/* V2 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white py-3 px-1 flex flex-col items-center justify-center text-center shadow-2xs">
                <ScalesDuotone className="h-7 w-7" />
                <div className="font-sans text-[11px] font-bold text-[#0F1B3D] mt-1.5">
                  {c.values.v2Title}
                </div>
              </div>

              {/* V3 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white py-3 px-1 flex flex-col items-center justify-center text-center shadow-2xs">
                <UsersThreeDuotone className="h-7 w-7" />
                <div className="font-sans text-[11px] font-bold text-[#0F1B3D] mt-1.5">
                  {c.values.v3Title}
                </div>
              </div>

              {/* V4 */}
              <div className="rounded-xl border border-[#E1E8F4] bg-white py-3 px-1 flex flex-col items-center justify-center text-center shadow-2xs">
                <LeafDuotone className="h-7 w-7" />
                <div className="font-sans text-[11px] font-bold text-[#0F1B3D] mt-1.5 truncate max-w-full px-0.5">
                  {c.values.v4Title}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. FINAL CTA BANNER                                       */}
        {/* ========================================================= */}
        <section>
          {/* Desktop Banner */}
          <div className="hidden lg:flex items-center justify-between rounded-2xl bg-[#0B2A6B] px-8 py-7 text-white shadow-md relative overflow-hidden">
            {/* Background crowd silhouette */}
            <div className="absolute inset-0 opacity-35 pointer-events-none">
              <Image
                src="/images/about-cta-bg.png?v=3"
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="100vw"
              />
            </div>

            {/* Left Headline + Red Brush Underline */}
            <div className="relative z-10">
              <h2 className="font-sans text-2xl font-extrabold leading-tight text-white tracking-tight">
                {c.ctaBanner.titleLine1} <br />
                {c.ctaBanner.titleLine2}
              </h2>
              <RedBrushUnderline className="w-52 h-[10px] mt-1.5" />
            </div>

            {/* Center Tagline */}
            <div className="relative z-10 text-xs text-white/85 max-w-[260px] text-left leading-relaxed">
              {c.ctaBanner.tagline}
            </div>

            {/* Right Button */}
            <div className="relative z-10">
              <Link
                href="/find-constituency"
                className="inline-flex items-center gap-2 rounded-[8px] bg-[#D0161F] hover:bg-[#B91C1C] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
              >
                <span>{c.ctaBanner.button}</span>
                <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
              </Link>
            </div>
          </div>

          {/* Mobile Banner */}
          <div className="flex lg:hidden items-center justify-between rounded-xl bg-[#0B2A6B] p-4 text-white shadow-sm relative overflow-hidden">
            {/* Background crowd silhouette */}
            <div className="absolute inset-0 opacity-35 pointer-events-none">
              <Image
                src="/images/about-cta-bg.png?v=3"
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="100vw"
              />
            </div>

            {/* Left Headline */}
            <div className="relative z-10">
              <h2 className="font-sans text-sm font-extrabold leading-tight text-white">
                {c.ctaBanner.titleLine1} <br />
                {c.ctaBanner.titleLine2}
              </h2>
              <RedBrushUnderline className="w-24 h-1.5 mt-0.5" />
            </div>

            {/* Right Button */}
            <div className="relative z-10">
              <Link
                href="/find-constituency"
                className="inline-flex items-center gap-1 rounded-[6px] bg-[#D0161F] px-3 py-1.5 text-[11px] font-bold text-white shadow-xs"
              >
                <span>{c.ctaBanner.button}</span>
                <ArrowRight className="h-3 w-3 stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* 8. FOOTER — REFERENCE REPRODUCTION                        */}
      {/* ========================================================= */}
      <footer className="mt-8 border-t border-[#E1E8F4] bg-[#F8FAFC] py-6">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 space-y-3">
          {/* Row 1: logo + tagline on left | links centered | social icons on right */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex flex-col leading-none shrink-0">
              <span className="font-sans text-[17px] font-extrabold tracking-[-0.015em] flex items-baseline">
                <span className="text-[#0F1B3D]">VOTER</span>
                <span className="text-[#D0161F]">SURVEY</span>
                <span className="text-[#0F1B3D] text-[13.5px] font-bold">.in</span>
              </span>
              <span className="font-sans text-[7.5px] font-normal text-slate-400 mt-[1.5px] tracking-[0.02em]">
                {c.footer.tagline}
              </span>
            </Link>

            {/* Desktop Navigation Links — Centered */}
            <div className="hidden lg:flex items-center gap-7 font-sans text-[13px] font-medium text-slate-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                {c.nav.home}
              </Link>
              <Link
                href="/find-constituency"
                className="hover:text-blue-600 transition-colors"
              >
                {c.nav.survey}
              </Link>
              <Link
                href="/results"
                className="hover:text-blue-600 transition-colors"
              >
                {c.nav.results}
              </Link>
              <Link
                href="/analysis"
                className="hover:text-blue-600 transition-colors"
              >
                {c.nav.news}
              </Link>
              <Link
                href="/about"
                className="font-bold text-[#0F1B3D] hover:text-blue-600 transition-colors"
              >
                {c.nav.about}
              </Link>
              <Link
                href="/contact"
                className="hover:text-blue-600 transition-colors"
              >
                {c.nav.contact}
              </Link>
            </div>

            {/* Social Icons (navy, ~20px) */}
            <div className="flex items-center gap-4 text-[#0F1B3D] shrink-0">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#2563EB] transition-colors"
                aria-label="X"
              >
                <XIcon size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#2563EB] transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#2563EB] transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon size={20} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#2563EB] transition-colors"
                aria-label="YouTube"
              >
                <YoutubeIcon size={20} />
              </a>
            </div>
          </div>

          {/* Row 2: Copyright on the left | Privacy Policy & Terms of Use on the right */}
          <div className="flex items-center justify-between font-sans text-[11.5px] text-slate-400 pt-1">
            <div>{c.footer.rights}</div>
            <div className="flex items-center gap-5">
              <Link
                href="/privacy"
                className="hover:text-slate-600 transition-colors"
              >
                {c.footer.privacy}
              </Link>
              <Link
                href="/terms"
                className="hover:text-slate-600 transition-colors"
              >
                {c.footer.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


