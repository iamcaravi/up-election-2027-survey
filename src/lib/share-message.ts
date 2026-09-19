// The promotional "hook" text, with no URL in it — used on its own for X's
// intent endpoint (which takes 	ext and url as separate params) and
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
// route through this one centralized function rather than building its own text, so
// there is exactly one place that decides what a completed survey is
// allowed to say when shared.
export function getSurveyShareMessage({
  locale,
  constituencyName,
}: {
  locale: "hi" | "en";
  constituencyName: string;
}): string {
  if (locale === "hi") {
    return `मैंने अपनी विधानसभा ${constituencyName} के सर्वे में अपनी राय दे दी है। 🗳️\nअब आपकी बारी है! आप भी अपने विधानसभा क्षेत्र का सर्वे करें और अपनी पसंद दर्ज करें।\nलोगों की राय से ही जनता का मूड सामने आएगा।\n👉 votersurvey.in`;
  }
  return `I’ve shared my opinion in the survey for my assembly constituency, ${constituencyName}. 🗳️\nNow it’s your turn! Take the survey for your constituency and share your preference.\nPublic participation helps show the current public opinion.\n👉 votersurvey.in`;
}

// Backward-compatible alias so existing callers seamlessly use the updated centralized message
export const buildSurveyCompletionShareMessage = getSurveyShareMessage;
