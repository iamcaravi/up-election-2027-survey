"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Building2,
  Users,
  ArrowRight,
} from "lucide-react";
import { FieldSelect, type SurveyEntryState } from "./SurveyEntryCard";
import { displayStateName, formatNumber } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDistrictDisplayName, UP_DISTRICT_HINDI_NAMES } from "@/lib/district-hindi";
import { getConstituencyDisplayName } from "@/lib/constituency-hindi";
import { matchesCrossLanguage } from "@/lib/search-normalization";

interface DistrictItem {
  id: string;
  slug: string;
  name: string;
  constituencyCount: number;
}

interface ConstituencyItem {
  id: string;
  slug: string;
  number: number;
  name: string;
}

export interface HomeHeroStats {
  responses: number;
  states: number;
  districts: number;
  constituencies: number;
  parties?: number;
}

interface HomeHeroProps {
  surveyStates: SurveyEntryState[];
  initialDistricts?: DistrictItem[];
  stats: HomeHeroStats;
}

export function HomeHero({ surveyStates, initialDistricts = [], stats }: HomeHeroProps) {
  const router = useRouter();
  const { locale, t } = useLocale();

  const [selectedState, setSelectedState] = useState<SurveyEntryState | null>(null);
  const [districts, setDistricts] = useState<DistrictItem[]>(initialDistricts);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(null);
  const [constituencies, setConstituencies] = useState<ConstituencyItem[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyItem | null>(null);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [startingSurvey, setStartingSurvey] = useState(false);

  // Set default state to UP if available
  useEffect(() => {
    if (surveyStates.length > 0 && !selectedState) {
      const up = surveyStates.find((s) => s.slug === "uttar-pradesh") ?? surveyStates[0];
      setSelectedState(up);
    }
  }, [surveyStates, selectedState]);

  // Load districts when state changes
  useEffect(() => {
    setSelectedDistrict(null);
    setSelectedConstituency(null);
    setConstituencies([]);

    if (!selectedState) {
      setDistricts([]);
      setLoadingDistricts(false);
      return;
    }

    if (selectedState.slug === "uttar-pradesh" && initialDistricts.length > 0) {
      setDistricts(initialDistricts);
      setLoadingDistricts(false);
      return;
    }

    setDistricts([]);
    setLoadingDistricts(true);
    fetch(`/api/districts?state=${selectedState.slug}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to load districts.");
        return data;
      })
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [selectedState, initialDistricts]);

  // Load constituencies when district changes
  useEffect(() => {
    setSelectedConstituency(null);
    setConstituencies([]);
    if (!selectedState || !selectedDistrict) {
      setLoadingConstituencies(false);
      return;
    }
    setLoadingConstituencies(true);
    fetch(`/api/districts/${selectedDistrict.slug}?state=${selectedState.slug}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to load constituencies.");
        return data;
      })
      .then((data) => setConstituencies(Array.isArray(data?.constituencies) ? data.constituencies : []))
      .catch(() => setConstituencies([]))
      .finally(() => setLoadingConstituencies(false));
  }, [selectedState, selectedDistrict]);

  const getSurveyHref = () => {
    if (selectedState && selectedConstituency) {
      const election = selectedState.elections[0];
      if (election) {
        return `/${selectedState.slug}/elections/${election.slug}/constituencies/${selectedConstituency.slug}/survey`;
      }
    }
    return "/find-constituency";
  };

  useEffect(() => {
    const href = getSurveyHref();
    if (href) router.prefetch(href);
  }, [selectedState, selectedConstituency, router]);

  const handleSurveyStart = () => {
    if (startingSurvey) return;
    setStartingSurvey(true);
    const href = getSurveyHref();
    window.location.assign(href);
  };

  // Real database stats dynamically fetched from Prisma
  const displayResponses = formatNumber(stats.responses);
  const displayStates = stats.states > 0 ? stats.states : 7;
  const displayDistricts = stats.districts > 0 ? stats.districts : 169;
  const displayConstituencies = stats.constituencies > 0 ? stats.constituencies : 940;

  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-white">
      {/* Background Image: Indian Parliament 4K (Vivid & Positioned Exactly Like Reference) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-parliament-4k.webp"
          alt="Indian Parliament"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1920px"
          className="object-cover object-[52%_center] md:object-[54%_center]"
        />
        {/* Soft text scrim only on the left side so Parliament remains vibrant & distinct */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-full lg:w-[60%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent h-16 bottom-0 top-auto" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headings & Selection Controls */}
          <div className="lg:col-span-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/90 bg-orange-50/95 px-3.5 py-1.5 text-xs font-bold text-orange-700 shadow-xs sm:text-sm">
              <MapPin size={15} className="text-orange-600 fill-orange-500/20 shrink-0" />
              <span>{locale === "hi" ? "चुनाव सर्वेक्षण 2027" : "Election Survey 2027"}</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-3.5 font-display text-3xl font-black tracking-tight text-[#101A3A] sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl leading-[1.12]">
              {locale === "hi" ? (
                <>
                  आपकी आवाज़
                  <br />
                  आपका क्षेत्र
                  <br />
                  <span className="text-[#ff5722]">बेहतर लोकतंत्र की ओर</span>
                </>
              ) : (
                <>
                  Your Voice
                  <br />
                  Your Constituency
                  <br />
                  <span className="text-[#ff5722]">Towards Stronger Democracy</span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="mt-2.5 max-w-xl text-sm font-medium text-slate-700 sm:text-base md:text-lg">
              {locale === "hi"
                ? "अपने विधानसभा क्षेत्र के विकास, समस्याओं और जनमत को जानने के लिए सर्वे में भाग लें।"
                : "Participate in the survey to share public opinion and insights for your constituency."}
            </p>

            {/* 4 Selection Controls: State, District, Constituency, CTA (Full-width stacked on mobile; horizontal row on desktop) */}
            <div className="mt-5 flex flex-col w-full gap-2.5 sm:gap-3 lg:flex-row lg:items-center">
              {/* State Dropdown */}
              <div className="w-full lg:w-auto">
                <FieldSelect
                  label={t.heroSurvey.selectState}
                  placeholder={t.heroSurvey.selectState}
                  value={selectedState}
                  items={surveyStates}
                  getLabel={(s) => displayStateName(s.name, s.slug, locale)}
                  getSearchTerms={(s) => [
                    s.name,
                    s.slug,
                    displayStateName(s.name, s.slug, "hi"),
                    displayStateName(s.name, s.slug, "en"),
                    "uttar pradesh",
                    "up",
                    "उत्तर प्रदेश",
                    "यूपी",
                    "punjab",
                    "पंजाब",
                    "gujarat",
                    "गुजरात",
                    "uttarakhand",
                    "उत्तराखंड",
                  ]}
                  matchesSearch={(s, q) =>
                    matchesCrossLanguage(
                      {
                        name: s.name,
                        slug: s.slug,
                        nameHi: displayStateName(s.name, s.slug, "hi"),
                        nameEn: displayStateName(s.name, s.slug, "en"),
                      },
                      q
                    )
                  }
                  onSelect={setSelectedState}
                  icon={<MapPin size={15} className="text-blue-600" />}
                  iconClass="bg-blue-50 text-blue-600"
                />
              </div>

              {/* District Dropdown */}
              <div className="w-full lg:w-auto">
                <FieldSelect
                  label={t.heroSurvey.selectDistrict}
                  placeholder={loadingDistricts ? t.common.loading : t.heroSurvey.selectDistrict}
                  value={selectedDistrict}
                  items={districts}
                  disabled={!selectedState || loadingDistricts}
                  getLabel={(d) => getDistrictDisplayName(d.slug, d.name, locale)}
                  getSearchTerms={(d) => [
                    d.name,
                    d.slug,
                    d.slug.replace(/-/g, " "),
                    UP_DISTRICT_HINDI_NAMES[d.slug] ?? "",
                    getDistrictDisplayName(d.slug, d.name, "hi"),
                    getDistrictDisplayName(d.slug, d.name, "en"),
                  ]}
                  matchesSearch={(d, q) =>
                    matchesCrossLanguage(
                      {
                        name: d.name,
                        slug: d.slug,
                        nameHi: UP_DISTRICT_HINDI_NAMES[d.slug] ?? getDistrictDisplayName(d.slug, d.name, "hi"),
                        nameEn: d.name,
                      },
                      q
                    )
                  }
                  onSelect={setSelectedDistrict}
                  icon={<Building2 size={15} className="text-blue-600" />}
                  iconClass="bg-blue-50 text-blue-600"
                />
              </div>

              {/* Constituency Dropdown */}
              <div className="w-full lg:w-auto">
                <FieldSelect
                  label={t.heroSurvey.selectConstituency}
                  placeholder={loadingConstituencies ? t.common.loading : (locale === "hi" ? "विधानसभा चुनें" : t.heroSurvey.selectConstituency)}
                  value={selectedConstituency}
                  items={constituencies}
                  disabled={!selectedDistrict || loadingConstituencies}
                  getLabel={(c) => `${c.number}. ${getConstituencyDisplayName(c.slug, c.name, locale)}`}
                  getSearchTerms={(c) => [
                    c.name,
                    c.slug,
                    c.slug.replace(/-/g, " "),
                    String(c.number),
                    `${c.number}. ${c.name}`,
                    `${c.number} ${c.name}`,
                    getConstituencyDisplayName(c.slug, c.name, "hi"),
                    `${c.number}. ${getConstituencyDisplayName(c.slug, c.name, "hi")}`,
                    `${c.number} ${getConstituencyDisplayName(c.slug, c.name, "hi")}`,
                  ]}
                  matchesSearch={(c, q) =>
                    matchesCrossLanguage(
                      {
                        name: c.name,
                        slug: c.slug,
                        number: c.number,
                        nameHi: getConstituencyDisplayName(c.slug, c.name, "hi"),
                        nameEn: c.name,
                      },
                      q
                    )
                  }
                  onSelect={setSelectedConstituency}
                  icon={<Users size={15} className="text-blue-600" />}
                  iconClass="bg-blue-50 text-blue-600"
                />
              </div>

              {/* Survey CTA Button */}
              <button
                type="button"
                onClick={handleSurveyStart}
                className="flex h-11 w-full lg:w-auto lg:min-w-[9.5rem] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#ff5722] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-[#f4511e] active:scale-98 sm:text-base lg:h-12"
              >
                {startingSurvey ? (
                  t.common.loading
                ) : (
                  <>
                    <span>{locale === "hi" ? "सर्वे देखें" : "Take Survey"}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Clean Stats (Integrated Panel on Desktop; 4 Horizontal Cards on Mobile) */}
          <div className="lg:col-span-4 lg:ml-auto w-full lg:max-w-[340px] mt-2 lg:mt-0">
            {/* Desktop View: Single floating panel */}
            <div className="hidden lg:block rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl">
              <div className="grid grid-cols-2 gap-3.5">
                {/* 1. कुल प्रतिभागी */}
                <div className="rounded-2xl bg-[#F8FAFC] p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-[#E8F8F0] text-[#10B981] flex items-center justify-center mb-2">
                    <Users size={20} />
                  </div>
                  <p className="font-display text-2xl sm:text-[26px] font-black text-slate-900 leading-tight">
                    {displayResponses}
                  </p>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                    {locale === "hi" ? "कुल प्रतिभागी" : "Total Participants"}
                  </span>
                </div>

                {/* 2. कुल राज्य */}
                <div className="rounded-2xl bg-[#F8FAFC] p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-[#E8F1FC] text-[#3B82F6] flex items-center justify-center mb-2">
                    <MapPin size={20} />
                  </div>
                  <p className="font-display text-2xl sm:text-[26px] font-black text-slate-900 leading-tight">
                    {displayStates}
                  </p>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                    {locale === "hi" ? "कुल राज्य" : "Total States"}
                  </span>
                </div>

                {/* 3. कुल जिले */}
                <div className="rounded-2xl bg-[#F8FAFC] p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-[#F3EEFC] text-[#8B5CF6] flex items-center justify-center mb-2">
                    <Building2 size={20} />
                  </div>
                  <p className="font-display text-2xl sm:text-[26px] font-black text-slate-900 leading-tight">
                    {displayDistricts}
                  </p>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                    {locale === "hi" ? "कुल जिले" : "Total Districts"}
                  </span>
                </div>

                {/* 4. कुल विधानसभा क्षेत्र */}
                <div className="rounded-2xl bg-[#F8FAFC] p-4 text-center flex flex-col items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-[#FEF2E8] text-[#F97316] flex items-center justify-center mb-2">
                    <Users size={20} />
                  </div>
                  <p className="font-display text-2xl sm:text-[26px] font-black text-slate-900 leading-tight">
                    {displayConstituencies}
                  </p>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                    {locale === "hi" ? "कुल विधानसभा क्षेत्र" : "Total Constituencies"}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile/Tablet View: 4 Individual Horizontal Cards Matching crop_mobile_stats.png exactly */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:hidden">
              {/* 1. कुल प्रतिभागी */}
              <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-display text-base font-black text-slate-900 leading-tight">
                    {displayResponses}
                  </p>
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-600 truncate mt-0.5">
                    {locale === "hi" ? "कुल प्रतिभागी" : "Participants"}
                  </span>
                </div>
              </div>

              {/* 2. कुल राज्य */}
              <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#E8F1FC] text-[#3B82F6] flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-display text-base font-black text-slate-900 leading-tight">
                    {displayStates}
                  </p>
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-600 truncate mt-0.5">
                    {locale === "hi" ? "कुल राज्य" : "States"}
                  </span>
                </div>
              </div>

              {/* 3. कुल जिले */}
              <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#F3EEFC] text-[#8B5CF6] flex items-center justify-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-display text-base font-black text-slate-900 leading-tight">
                    {displayDistricts}
                  </p>
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-600 truncate mt-0.5">
                    {locale === "hi" ? "कुल जिले" : "Districts"}
                  </span>
                </div>
              </div>

              {/* 4. कुल विधानसभा क्षेत्र */}
              <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[#FEF2E8] text-[#F97316] flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="font-display text-base font-black text-slate-900 leading-tight">
                    {displayConstituencies}
                  </p>
                  <span className="text-xs sm:text-[13px] font-semibold text-slate-600 truncate mt-0.5">
                    {locale === "hi" ? "कुल विधानसभा क्षेत्र" : "Constituencies"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
