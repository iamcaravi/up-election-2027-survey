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
