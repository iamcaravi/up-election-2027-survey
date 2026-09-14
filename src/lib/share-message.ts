// The promotional "hook" text, with no URL in it — used on its own for X's
// intent endpoint (which takes `text` and `url` as separate params) and
// combined with the URL below for WhatsApp/clipboard/native share, so the
// exact same hook copy backs every share surface instead of being
// duplicated per platform.
export function buildResultShareHook({
  locale,
  electionYear,
  scopeName,
}: {
  locale: "hi" | "en";
  electionYear: number;
  scopeName: string;
}): string {
  if (locale === "hi") {
    return `${scopeName} में ${electionYear} चुनाव में कौन बाज़ी मार रहा है?\nसिर्फ 10 सेकंड में सर्वे करें और परिणाम देखें 👇`;
  }
  return `Who's leading in ${scopeName} for the ${electionYear} election?\nTake this 10-second survey and see what voters are saying 👇`;
}

// Full "hook + URL" text — never just the bare URL. Used by WhatsApp, the
// clipboard fallback, and the native Web Share API.
export function buildResultShareMessage(args: { locale: "hi" | "en"; electionYear: number; scopeName: string; url: string }): string {
  return `${buildResultShareHook(args)}\n${args.url}`;
}

// Post-submission "I just took the survey" share text (survey completion
// screen's Share button — see SurveyExperience.tsx's handleShare()).
// Deliberately contains ONLY the constituency name and a generic invite —
// never the party/candidate/option the respondent actually picked, which
// this function has no access to in the first place by design. Every
// share surface (native Web Share, WhatsApp, clipboard fallback) must
// route through this one function rather than building its own text, so
// there is exactly one place that decides what a completed survey is
// allowed to say when shared.
export function buildSurveyCompletionShareMessage({
  locale,
  constituencyName,
}: {
  locale: "hi" | "en";
  constituencyName: string;
}): string {
  if (locale === "hi") {
    return `🗳️ मैंने VoterSurvey पर अपनी राय दी!\n📍 मेरी विधानसभा: ${constituencyName}\n\nअब देखिए आपके क्षेत्र में जनता का मूड क्या है।\nआप भी अपनी राय दें।\n\n👉 VoterSurvey.in`;
  }
  return `🗳️ I shared my opinion on VoterSurvey!\n📍 My Constituency: ${constituencyName}\n\nSee what people in your constituency are thinking.\nShare your opinion too.\n\n👉 VoterSurvey.in`;
}
