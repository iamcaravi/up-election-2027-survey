import Link from "next/link";
import { ArrowRight, BarChart2, BarChart3, Calendar, Sliders, TrendingUp, User, Users, Info } from "lucide-react";
import type { ResolvedScope, ScopeSummary } from "@/lib/scoped-survey";
import { analysisScopePath } from "@/lib/routes";
import { formatNumber } from "@/lib/utils";
import { ScopeHero } from "@/components/scope/ScopeHeader";
import { ScopeContent, ScopeNavProvider, ScopeSelectors } from "@/components/scope/ScopeNav";
import { Donut, EmptyNote, IssueBars, PartyBars } from "@/components/scope/charts";

// THE canonical public Result experience (State / District / Assembly).
// Answers "क्या परिणाम आया?" — concise by design: party support, MLA opinion,
// main issues, then a hand-off to the canonical Analysis page with the SAME
// scope. Every entry point (header, footer, homepage, survey completion, old
// deep links) lands here.

export function ScopedResultsView({ scope, data, hi }: { scope: ResolvedScope; data: ScopeSummary | null; hi: boolean }) {
  const year = scope.election?.year ?? 2027;
  const placeName = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name ?? "";
  const hasData = !!data && data.total > 0;

  return (
    <ScopeNavProvider>
      <div className="min-h-screen bg-[#f4f7fb] pb-12 text-slate-800">
        <ScopeHero
          scope={scope}
          hi={hi}
          leaf={hi ? "परिणाम" : "Results"}
          titleFallback={hi ? "सर्वेक्षण परिणाम" : "Survey Results"}
          subtitle={hi ? `विधानसभा चुनाव सर्वेक्षण ${year} - परिणाम` : `Assembly Election Survey ${year} - Results`}
          description={
            scope.level === "none"
              ? hi
                ? "राज्य, जिला या विधानसभा क्षेत्र चुनकर वहाँ के मतदाताओं की राय, प्रमुख मुद्दों, विधायक के कार्यों और पार्टी समर्थन का सारांश देखें।"
                : "Choose a state, district or constituency to see a summary of voter opinion, key issues, MLA performance and party support."
              : hi
                ? `यहाँ आप ${placeName} के उत्तरदाताओं की राय, प्रमुख मुद्दों, वर्तमान विधायक के कार्यों और पार्टी समर्थन का सारांश देख सकते हैं।`
                : `A summary of respondents' opinion in ${placeName}: key issues, current MLA performance and party support.`
          }
          aside={
            data ? (
              <div className="grid shrink-0 grid-cols-3 gap-2 sm:gap-3.5 lg:w-[500px]">
                <Kpi icon={<Users size={18} />} tone="bg-purple-50 text-purple-600" value={formatNumber(data.total)} label={hi ? "कुल प्रतिक्रियाएं" : "Total responses"} sub={hi ? "अब तक प्राप्त" : "So far"} />
                <Kpi icon={<Calendar size={18} />} tone="bg-amber-50 text-amber-600" value={formatNumber(data.today)} label={hi ? "आज की प्रतिक्रियाएं" : "Today's responses"} sub={hi ? "आज प्राप्त" : "Received today"} />
                <Kpi
                  icon={<TrendingUp size={18} />}
                  tone="bg-emerald-50 text-emerald-600"
                  value={data.surveyActive ? (hi ? "सक्रिय" : "Active") : hi ? "बंद" : "Closed"}
                  valueClass={data.surveyActive ? "text-emerald-600" : "text-slate-500"}
                  label={hi ? "सर्वेक्षण स्थिति" : "Survey status"}
                  sub={data.surveyActive ? (hi ? "मत देना जारी है" : "Voting open") : hi ? "सर्वे बंद है" : "Survey closed"}
                />
              </div>
            ) : null
          }
          below={
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs sm:p-4">
              <p className="mb-2 text-xs font-bold text-slate-600">{hi ? "परिणाम का क्षेत्र चुनें" : "Choose the result scope"}</p>
              <ScopeSelectors key={JSON.stringify(scope.params)} hi={hi} basePath="/results" value={scope.params} options={scope.options} />
            </div>
          }
        />

        <div className="mx-auto mt-6 max-w-7xl px-4 sm:mt-8 sm:px-6 lg:px-8">
          <ScopeContent hi={hi}>
            {scope.level === "none" ? (
              <Notice text={hi ? "परिणाम देखने के लिए राज्य चुनें।" : "Select a state to view results."} />
            ) : !hasData ? (
              <Notice text={hi ? "इस क्षेत्र के लिए अभी पर्याप्त सर्वेक्षण डेटा उपलब्ध नहीं है।" : "Not enough survey data is available for this area yet."} />
            ) : (
              <>
                <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
                  <Card
                    icon={<Sliders size={15} strokeWidth={2.5} />}
                    title={hi ? "पार्टी-वार समर्थन" : "Party-wise support"}
                    sub={hi ? "सर्वे में किस पार्टी को कितने उत्तरदाताओं का समर्थन मिला?" : "How many respondents chose each party in the survey?"}
                    foot={hi ? `कुल ${formatNumber(data!.party.answered)} उत्तरदाताओं पर आधारित` : `Based on ${formatNumber(data!.party.answered)} respondents`}
                  >
                    {data!.party.answered > 0 ? <PartyBars dist={data!.party} /> : <EmptyNote>{hi ? "इस प्रश्न के लिए अभी डेटा उपलब्ध नहीं है।" : "No data for this question yet."}</EmptyNote>}
                  </Card>

                  <Card
                    icon={<User size={15} strokeWidth={2.5} />}
                    title={scope.level === "constituency" ? (hi ? "वर्तमान विधायक के कार्यों पर राय" : "Opinion on the current MLA") : hi ? "वर्तमान विधायकों के कार्यों पर राय" : "Opinion on current MLAs"}
                    sub={
                      scope.level === "constituency"
                        ? scope.constituency?.currentMlaName
                          ? `${hi ? "विधायक" : "MLA"}: ${scope.constituency.currentMlaName}${scope.constituency.currentMlaParty ? ` (${scope.constituency.currentMlaParty})` : ""}`
                          : hi ? "उत्तरदाताओं की राय के अनुसार" : "As reported by respondents"
                        : hi ? "उत्तरदाताओं ने अपने-अपने क्षेत्र के विधायक के बारे में राय दी" : "Each respondent rated their own constituency's MLA"
                    }
                    foot={hi ? `कुल ${formatNumber(data!.mla.answered)} उत्तरों पर आधारित` : `Based on ${formatNumber(data!.mla.answered)} answers`}
                  >
                    {data!.mla.answered > 0 ? (
                      <Donut items={data!.mla.items} total={data!.mla.answered} centerLabel={hi ? "कुल उत्तर" : "answers"} />
                    ) : (
                      <EmptyNote>{hi ? "इस प्रश्न के लिए अभी डेटा उपलब्ध नहीं है।" : "No data for this question yet."}</EmptyNote>
                    )}
                  </Card>

                  <Card
                    icon={<BarChart3 size={15} strokeWidth={2.5} />}
                    title={hi ? "मुख्य मुद्दे (बहुविकल्पीय)" : "Main issues (multi-select)"}
                    sub={hi ? `${placeName} के उत्तरदाताओं के लिए सबसे महत्वपूर्ण मुद्दे` : `Most important issues for respondents in ${placeName}`}
                    foot={hi ? `कुल ${formatNumber(data!.issues.answered)} उत्तरदाताओं पर आधारित` : `Based on ${formatNumber(data!.issues.answered)} respondents`}
                    note={hi ? "प्रतिशत उत्तरदाताओं के आधार पर; एक से अधिक विकल्प चुने जा सकते हैं।" : "Share of respondents; more than one option could be chosen."}
                  >
                    {data!.issues.answered > 0 ? <IssueBars dist={data!.issues} limit={5} /> : <EmptyNote>{hi ? "इस प्रश्न के लिए अभी डेटा उपलब्ध नहीं है।" : "No data for this question yet."}</EmptyNote>}
                  </Card>
                </div>
              </>
            )}

            {scope.level !== "none" && (
              <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-orange-200/80 bg-gradient-to-r from-[#fff7ed] via-[#fff4ea] to-[#fff7ed] p-5 shadow-2xs sm:mt-7 sm:p-6 md:flex-row md:items-center">
                <div className="flex items-start gap-4 sm:items-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-[#ea580c] shadow-2xs sm:h-14 sm:w-14">
                    <BarChart2 className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black leading-tight tracking-tight text-slate-900 sm:text-2xl">{hi ? "विस्तृत विश्लेषण देखें" : "View detailed analysis"}</h2>
                    <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                      {hi
                        ? `${placeName} के सर्वेक्षण परिणामों का विस्तृत विश्लेषण — अलग-अलग वर्गों की राय, रुझान, तुलना और निर्यात योग्य आंकड़े।`
                        : `Detailed analysis of ${placeName}'s results — group-wise opinion, trends, comparisons and exportable data.`}
                    </p>
                  </div>
                </div>
                <Link
                  href={analysisScopePath(scope.params)}
                  className="flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#ea580c] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#c2410c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 sm:text-base md:w-auto"
                >
                  {hi ? "विस्तृत विश्लेषण देखें" : "View detailed analysis"}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}
          </ScopeContent>
        </div>
      </div>
    </ScopeNavProvider>
  );
}

function Kpi({
  icon,
  tone,
  value,
  label,
  sub,
  valueClass,
}: {
  icon: React.ReactNode;
  tone: string;
  value: string;
  label: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:gap-3 sm:p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <div className={`text-xl font-black leading-tight text-slate-900 sm:text-2xl ${valueClass ?? ""}`}>{value}</div>
        <div className="text-[11px] font-bold leading-tight text-slate-700 sm:text-xs">{label}</div>
        <div className="mt-0.5 hidden text-[10px] font-medium leading-tight text-slate-500 sm:block">{sub}</div>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  sub,
  foot,
  note,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  foot: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs sm:p-6">
      <div>
        <div className="mb-1 flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#2563eb]" aria-hidden="true">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-black leading-tight tracking-tight text-slate-900">{title}</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{sub}</p>
          </div>
        </div>
        <div className="pt-5">{children}</div>
      </div>
      <div className="mt-6 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
        <p className="flex items-center gap-1.5">
          <Users size={13} className="text-slate-400" aria-hidden="true" />
          {foot}
        </p>
        {note && (
          <p className="mt-1 flex items-start gap-1.5">
            <Info size={13} className="mt-px shrink-0 text-slate-400" aria-hidden="true" />
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-700">{text}</p>
    </div>
  );
}
