import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { FindConstituencyFlow } from "@/components/find-constituency/FindConstituencyFlow";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return locale === "hi"
    ? { title: "अपना विधानसभा क्षेत्र खोजें", description: "सार्वजनिक सर्वे में भाग लेने या परिणाम देखने के लिए अपना राज्य, जिला और विधानसभा क्षेत्र चुनें।" }
    : { title: "Find Your Constituency", description: "Select your state, district and assembly constituency to take the public survey or see its results." };
}

// THE canonical constituency finder (header "विधानसभा क्षेत्र"):
// State → District → Assembly constituency → the existing constituency page.
// The query string (?state=&district=&constituency=) carries the selection so
// refresh and browser Back restore it.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function FindConstituencyPage({ searchParams }: { searchParams: SearchParams }) {
  const [states, locale, sp] = [await getStates(), await getServerLocale(), await searchParams];
  const hi = locale === "hi";
  const stateOptions = states.map((s) => ({ slug: s.slug, name: s.name, electionSlug: s.elections[0]?.slug ?? null }));

  return (
    <div className="relative overflow-hidden bg-[#f7fafe]">
      {/* Very faint decorative dot fields beside the heading (CSS only). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[3%] top-40 hidden h-36 w-40 opacity-60 lg:block"
        style={{ backgroundImage: "radial-gradient(#c9d5e6 1.3px, transparent 1.3px)", backgroundSize: "26px 26px" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[3%] top-56 hidden h-44 w-44 opacity-60 lg:block"
        style={{ backgroundImage: "radial-gradient(#c9d5e6 1.3px, transparent 1.3px)", backgroundSize: "26px 26px" }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pb-9 lg:px-8">
        <Breadcrumb items={[{ label: hi ? "विधानसभा क्षेत्र खोजें" : "Find your constituency" }]} />

        <div className="mx-auto mt-6 max-w-[1180px] sm:mt-9">
          <h1 className="text-center font-display text-[32px] font-black leading-tight tracking-tight text-[#0b1b3a] sm:text-[44px] lg:text-[52px]">
            {hi ? "अपना विधानसभा क्षेत्र खोजें" : "Find your assembly constituency"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[15px] leading-relaxed text-[#5b6b82] sm:text-[18px]">
            {hi ? (
              <>
                सर्वे में भाग लेने या अपने क्षेत्र के परिणाम देखने के लिए
                <br className="hidden sm:inline" /> अपना राज्य, जिला और विधानसभा क्षेत्र चुनें।
              </>
            ) : (
              "Choose your state, district and assembly constituency to take the survey or see your area's results."
            )}
          </p>

          <div className="mt-7 sm:mt-9">
            <FindConstituencyFlow
              states={stateOptions}
              initial={{ state: one(sp.state), district: one(sp.district), constituency: one(sp.constituency) }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
