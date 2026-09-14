// Single source of truth for the public FAQ page — both the visible
// accordion (src/components/faq/FaqAccordion.tsx) and the FAQPage JSON-LD
// emitted by src/app/faq/page.tsx read this exact array, so the structured
// data can never drift from what a visitor actually sees on the page.
export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  label: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "general",
    label: "General",
    items: [
      {
        q: "What is VoterSurvey.in?",
        a: "VoterSurvey.in is an independent, voluntary public-opinion survey platform covering state assembly elections. Anyone can share their party preference and view of key issues for their assembly constituency, and the site aggregates those responses into public results and analysis.",
      },
      {
        q: "What is the purpose of VoterSurvey.in?",
        a: "The platform gives people a simple way to record their current party preference and the issues they care about, and gives everyone a transparent, constituency-level view of those aggregated responses — for informational and statistical purposes only.",
      },
      {
        q: "Is VoterSurvey.in the Election Commission of India?",
        a: "No. VoterSurvey.in is not the Election Commission of India (ECI) and has no official role in the conduct or administration of any election.",
      },
      {
        q: "Is VoterSurvey.in affiliated with the Election Commission?",
        a: "No. VoterSurvey.in is not affiliated with, operated by, endorsed by, or officially associated with the Election Commission of India or any State Election Commission unless explicitly stated otherwise. See our Disclaimer for full details.",
      },
      {
        q: "Is this an official election result website?",
        a: "No. This is a survey platform. It does not publish, and should not be treated as, official election results.",
      },
      {
        q: "Are these actual election results?",
        a: "No. The numbers shown are aggregated responses from voluntary participants in our survey — not votes counted in an actual election.",
      },
      {
        q: "What is an opinion survey?",
        a: "An opinion survey collects the views of people who choose to respond, on a voluntary basis. Unlike an election, it is not a comprehensive or compulsory vote of the whole electorate, so its results reflect only those who participated.",
      },
      {
        q: "How is VoterSurvey different from an official election result?",
        a: "An official election result comes from votes cast and counted by the Election Commission under election law. VoterSurvey's numbers come from voluntary, self-selected survey responses submitted through this website — a different process with different limitations (see the Results FAQs below).",
      },
      {
        q: "Is VoterSurvey.in affiliated with any political party?",
        a: "No. VoterSurvey.in is independent and is not affiliated with, funded by, or run on behalf of any political party or candidate.",
      },
    ],
  },
  {
    id: "survey",
    label: "Survey",
    items: [
      {
        q: "How does the survey work?",
        a: "You pick your assembly constituency, then answer a short set of questions — your party preference, the issues that matter most to you, and a few optional demographic questions. Your answers are added anonymously to that constituency's aggregate results.",
      },
      {
        q: "How can I participate?",
        a: "Use \"Find Constituency\" to locate your assembly constituency, or navigate there from your state's page, then take the survey shown there. It takes about two minutes.",
      },
      {
        q: "Who can participate?",
        a: "The survey is open to anyone who wants to share an opinion. It does not verify voter eligibility, age, or residency, so it should not be read as a survey of confirmed voters only.",
      },
      {
        q: "Can I participate more than once?",
        a: "Each response is checked for duplicates using anonymous, one-way hashes of your device and connection, so resubmitting the same constituency's survey from the same device or connection will not be counted more than once.",
      },
      {
        q: "How are responses counted?",
        a: "Every valid, non-duplicate submission for a constituency is included in that constituency's aggregate — and rolls up into its district and state totals.",
      },
      {
        q: "How is party support calculated?",
        a: "Party Support is the percentage of respondents who answered the party-preference question with a valid, publicly eligible party option — each party's share of that specific denominator (respondents who gave a valid party answer), not of everyone who took any part of the survey.",
      },
      {
        q: "Why don't percentages always add up to 100%?",
        a: "Party Support percentages are rounded and, in some views, a very small category may be withheld from public display to protect privacy (see Data/Privacy below) — which can make the visible total slightly under 100%.",
      },
      {
        q: "What does \"undecided\" mean?",
        a: "\"Undecided\" is a respondent who took the survey but told us they haven't picked a party yet, rather than skipping the question entirely.",
      },
      {
        q: "What does \"Other / Independent\" mean?",
        a: "\"Other / Independent\" covers respondents who prefer a party or candidate not individually listed as a featured option for that constituency's survey.",
      },
      {
        q: "How are issue preferences measured?",
        a: "Respondents are asked which issues matter most to them for the election, from a fixed list (e.g. employment, inflation, roads, health, education).",
      },
      {
        q: "Can respondents select multiple issues?",
        a: "Yes. The issues question allows selecting more than one issue, since real priorities are rarely just one thing.",
      },
      {
        q: "Why can issue percentages add up to more than 100%?",
        a: "Because respondents can select multiple issues, each issue's percentage is its share of total selections, not a share of respondents — so the percentages don't need to sum to 100%.",
      },
      {
        q: "How are constituency-level responses handled?",
        a: "Each response belongs to exactly one assembly constituency (the one the respondent selected) and is included in that constituency's results, and rolled up into its district and state aggregates.",
      },
      {
        q: "How often is survey data updated?",
        a: "Results update as new responses come in — the Results and Analysis pages read live aggregated data, not a periodic snapshot.",
      },
    ],
  },
  {
    id: "results",
    label: "Results",
    items: [
      {
        q: "What does the Results page show?",
        a: "A focused summary for a state, district, or constituency: Party Support (current survey) and Key Issues, plus a link into the fuller Analysis dashboard.",
      },
      {
        q: "What is Party Support?",
        a: "The current survey's party-preference breakdown — the percentage and response count for each party among respondents who gave a valid party answer.",
      },
      {
        q: "What is Party Landscape?",
        a: "\"Party Landscape\" is the Analysis page's module presenting the same underlying party-preference data as Party Support, alongside Current Vote Share, in a layout suited to the more detailed Analysis view.",
      },
      {
        q: "What are Key Issues / Top Issues?",
        a: "A breakdown of which issues respondents selected most often, with the highest-ranked issues highlighted separately as \"Top Issues\".",
      },
      {
        q: "What does \"Total Responses\" mean?",
        a: "The total number of valid, de-duplicated survey submissions included in the results shown on that page (statewide, district, or constituency, depending on which page you're on).",
      },
      {
        q: "Why can the number of responses differ between pages?",
        a: "A state's total includes every constituency in it; a district's total includes only its own constituencies; a constituency's total is just that constituency — so the same respondent is reflected at every level, but the totals themselves naturally differ by scope.",
      },
      {
        q: "Why might a constituency have limited responses?",
        a: "Participation is voluntary, so response counts vary — a newer or less-shared constituency page will naturally have fewer responses, and very small groups may be withheld from public display (see Data/Privacy below).",
      },
      {
        q: "Why can results change over time?",
        a: "Because the survey is ongoing, new responses keep being added — results reflect all responses received so far, not a fixed one-time poll.",
      },
      {
        q: "Are the results a prediction?",
        a: "No. Results describe survey responses received to date. They are not a forecast or prediction of how an election will turn out.",
      },
      {
        q: "Are the results the final election result?",
        a: "No. Only the Election Commission of India's official count is the final election result. See our Disclaimer.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Data / Privacy",
    items: [
      {
        q: "What information is collected?",
        a: "Your survey answers, plus a salted one-way hash of your IP address and a salted one-way hash of a random device identifier — used only to detect duplicate submissions. We do not ask for your name, phone number, email address, or any government ID. See our Privacy Policy for full details.",
      },
      {
        q: "Is my identity publicly displayed?",
        a: "No. Individual responses are never published or exported with any identifying information — only anonymous, aggregate breakdowns are shown publicly.",
      },
      {
        q: "How is survey data protected?",
        a: "Demographic and duplicate-detection data is stored as one-way salted hashes that cannot be reversed to recover the original value, and any group with fewer than the platform's configured minimum number of responses is withheld from public display rather than shown with a tiny, potentially identifying sample.",
      },
      {
        q: "Can I request removal/correction of information?",
        a: "If you believe specific information concerning you needs review, contact us at votersurveyindia@gmail.com and describe the concern — see our Contact page's \"Privacy / Data Requests\" section.",
      },
      {
        q: "Who can contact VoterSurvey.in about privacy concerns?",
        a: "Anyone. Use the Privacy / Data Requests category on our Contact page, or email votersurveyindia@gmail.com directly.",
      },
      {
        q: "How can I contact VoterSurvey.in?",
        a: "Email votersurveyindia@gmail.com, or use the categorized Contact page for general, survey/data, technical, privacy, or regulatory enquiries.",
      },
      {
        q: "What does \"simulated data\" mean?",
        a: "Some states/pages may show a clearly labelled \"Demo • Simulated Data\" banner while real participation is still building up. That data is generated for demo/testing purposes only, is always labelled as such, and is never presented as real survey responses.",
      },
    ],
  },
  {
    id: "election-regulatory",
    label: "Election / Regulatory",
    items: [
      {
        q: "Is VoterSurvey.in authorized by ECI?",
        a: "No. VoterSurvey.in does not claim to be, and is not, \"approved\", \"certified\", \"registered\", or \"authorized\" by the Election Commission of India or any State Election Commission.",
      },
      {
        q: "What happens if an election authority contacts VoterSurvey.in?",
        a: "If the Election Commission of India, a State Election Commission, or another competent statutory authority raises a concern about this website or its content, VoterSurvey.in will provide a reasonable channel for that communication and cooperate in addressing it in accordance with applicable law — see our Disclaimer's Regulatory Cooperation clause. Such communications can be sent to votersurveyindia@gmail.com.",
      },
      {
        q: "Can election-related restrictions affect publication of survey information?",
        a: "Yes. Election-period restrictions — including those concerning opinion polls, exit polls, and publication of election-related material — may apply depending on the election, jurisdiction, and timing, and publication on this platform may be paused or adjusted accordingly. Users should refer to official law/instructions where applicable.",
      },
      {
        q: "Where should I check official election information?",
        a: "Always check the Election Commission of India (eci.gov.in) and the relevant State Election Commission's official channels for authoritative election information.",
      },
      {
        q: "Where can I find official election results?",
        a: "Official results are published by the Election Commission of India, not by this platform. Please refer to eci.gov.in.",
      },
    ],
  },
  {
    id: "technical",
    label: "Technical",
    items: [
      {
        q: "Why is a page not loading?",
        a: "This can happen from a temporary connectivity issue or an invalid/outdated link. Try reloading, or start again from the Home page.",
      },
      {
        q: "Why is a chart showing limited data?",
        a: "A chart shows fewer categories or a \"not enough data yet\" message when a state, district, or constituency doesn't yet have enough responses to display that breakdown while protecting respondent privacy.",
      },
      {
        q: "Why does a constituency not appear?",
        a: "Use \"Find Constituency\" to search by name — if a constituency genuinely isn't listed for a state/election, it may not yet be configured on the platform.",
      },
      {
        q: "Why might data differ between visits?",
        a: "Because the survey is ongoing, new responses are added continuously, so numbers you see can change between visits.",
      },
      {
        q: "How can I report a technical problem?",
        a: "Use the \"Technical Support\" category on our Contact page, or email votersurveyindia@gmail.com with the page URL and a short description of the issue.",
      },
    ],
  },
];
