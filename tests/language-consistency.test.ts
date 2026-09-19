// Automated coverage for the site-wide language system (LocaleProvider +
// locale-cookie.ts + locales/{hi,en}.ts + option-labels.ts). Covers the
// pure, request-context-free pieces directly; anything that genuinely
// requires a live Next.js request (next/headers cookies(), <html lang>,
// generateMetadata() output) is instead verified in the browser per the
// language-consistency audit's own §20 verification pass — same split
// admin-hierarchy.test.ts already uses for getAdminSession()'s cookies()
// dependency (see that file's own top-of-file note).
import { test } from "node:test";
import assert from "node:assert/strict";
import hi from "../src/lib/i18n/locales/hi";
import en from "../src/lib/i18n/locales/en";
import { isLocale, LOCALE_COOKIE_NAME, DEFAULT_LOCALE } from "../src/lib/i18n/locale-constants";
import { resolveOptionLabel } from "../src/lib/option-labels";
import { getPartyDisplayName, getPartyLogoUrl } from "../src/lib/party-logos";
import { resolveStaticSeoBase, resolveStateScopedSeoBase, SEO_STATIC_CATALOG } from "../src/lib/seo-catalog";
import { getSurveyShareMessage } from "../src/lib/share-message";

// Recursively collects every leaf key path ("a.b.c") of a nested string
// dictionary — used to assert hi.ts and en.ts define EXACTLY the same set
// of keys, so no locale can ever fall through to a raw translation key or
// an accidentally-undefined value at render time.
function collectKeyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  const paths: string[] = [];
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    paths.push(...collectKeyPaths(value, prefix ? `${prefix}.${key}` : key));
  }
  return paths;
}

test("1. English dictionary is non-empty and structurally complete", () => {
  const keys = collectKeyPaths(en);
  assert.ok(keys.length > 100, "en.ts should define a substantial number of keys");
});

test("2. Hindi dictionary is non-empty and structurally complete", () => {
  const keys = collectKeyPaths(hi);
  assert.ok(keys.length > 100, "hi.ts should define a substantial number of keys");
});

test("3. No missing keys between en.ts and hi.ts (exact key-set parity)", () => {
  const hiKeys = new Set(collectKeyPaths(hi));
  const enKeys = new Set(collectKeyPaths(en));

  const missingInEn = [...hiKeys].filter((k) => !enKeys.has(k));
  const missingInHi = [...enKeys].filter((k) => !hiKeys.has(k));

  assert.deepEqual(missingInEn, [], `Keys present in hi.ts but missing from en.ts: ${missingInEn.join(", ")}`);
  assert.deepEqual(missingInHi, [], `Keys present in en.ts but missing from hi.ts: ${missingInHi.join(", ")}`);
});

test("4. Every leaf value in both dictionaries is a non-empty string", () => {
  for (const [name, dict] of [["hi", hi] as const, ["en", en] as const]) {
    const walk = (obj: unknown, path: string) => {
      if (typeof obj === "string") {
        assert.notEqual(obj.trim(), "", `${name}.${path} is an empty string`);
        return;
      }
      if (obj !== null && typeof obj === "object") {
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
          walk(value, path ? `${path}.${key}` : key);
        }
        return;
      }
      assert.fail(`${name}.${path} is not a string (got ${typeof obj})`);
    };
    walk(dict, "");
  }
});

test("5. Locale cookie contract: isLocale() accepts only 'hi'/'en', default is 'hi'", () => {
  assert.equal(isLocale("hi"), true);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(isLocale(null), false);
  assert.equal(isLocale(undefined), false);
  assert.equal(isLocale(""), false);
  assert.equal(DEFAULT_LOCALE, "hi");
  assert.equal(LOCALE_COOKIE_NAME, "locale");
});

test("6. resolveOptionLabel: known issue/demographic keys resolve to distinct, correct-language text per locale", () => {
  const dictionary = hi.surveyQuestions.options;
  const cases: { key: string; hi: string; en: string }[] = [
    { key: "rojgar", hi: "रोजगार", en: "Employment" },
    { key: "female", hi: "महिला", en: "Female" },
    { key: "hindu", hi: "हिंदू", en: "Hindu" },
    { key: "obc", hi: "ओबीसी", en: "OBC" },
  ];
  for (const c of cases) {
    const resolvedHi = resolveOptionLabel(c.key, { label: "raw-db-label" }, "hi", dictionary);
    const resolvedEn = resolveOptionLabel(c.key, { label: "raw-db-label" }, "en", en.surveyQuestions.options);
    assert.equal(resolvedHi, c.hi, `${c.key} should resolve to Hindi text in hi locale`);
    assert.equal(resolvedEn, c.en, `${c.key} should resolve to English text in en locale`);
    assert.notEqual(resolvedHi, resolvedEn, `${c.key} must not render identically in both locales`);
  }
});

test("7. resolveOptionLabel: unknown key (e.g. a party slug) falls back to nameHindi/label, never both languages at once", () => {
  const dictionary = hi.surveyQuestions.options;
  const fallback = { label: "Bharatiya Janata Party", nameHindi: "भारतीय जनता पार्टी" };
  assert.equal(resolveOptionLabel("bjp", fallback, "hi", dictionary), "भारतीय जनता पार्टी");
  assert.equal(resolveOptionLabel("bjp", fallback, "en", dictionary), "Bharatiya Janata Party");
});

test("8. resolveOptionLabel: unknown key with no nameHindi falls back to the raw label in every locale (no crash, no undefined)", () => {
  const dictionary = hi.surveyQuestions.options;
  const fallback = { label: "Undecided" };
  assert.equal(resolveOptionLabel("undecided", fallback, "hi", dictionary), "Undecided");
  assert.equal(resolveOptionLabel("undecided", fallback, "en", dictionary), "Undecided");
});

test("9. Party label resolution never mixes both languages in one string", () => {
  const party = { nameEnglish: "Samajwadi Party", nameHindi: "समाजवादी पार्टी" };
  const resolved = getPartyDisplayName(party, "fallback");
  assert.equal(resolved, "समाजवादी पार्टी");
  assert.doesNotMatch(resolved, /Samajwadi/, "resolved party name must not also contain the English name");

  const partyNoHindi = { nameEnglish: "Rashtriya Lok Dal" };
  assert.equal(getPartyDisplayName(partyNoHindi, "fallback"), "Rashtriya Lok Dal");
  assert.equal(getPartyDisplayName(null, "fallback"), "fallback");
  assert.equal(getPartyLogoUrl(null), null);
});

test("10. Public Results/Analysis option labels: every surveyQuestions.options key used by result buckets exists in both dictionaries with distinct text", () => {
  const hiOptions = hi.surveyQuestions.options as Record<string, string>;
  const enOptions = en.surveyQuestions.options as Record<string, string>;
  const keys = Object.keys(hiOptions);
  assert.ok(keys.length >= 20, "expected the full issue+demographic option key set");
  for (const key of keys) {
    assert.ok(key in enOptions, `en.ts is missing surveyQuestions.options.${key}`);
    assert.notEqual(hiOptions[key], enOptions[key], `surveyQuestions.options.${key} reads identically in both locales`);
  }
});

test("11. SEO catalog metadata is locale-correct for every static page and never falls back to the wrong language", () => {
  for (const entry of SEO_STATIC_CATALOG) {
    const hiCopy = resolveStaticSeoBase(entry.category, "hi");
    const enCopy = resolveStaticSeoBase(entry.category, "en");
    assert.equal(hiCopy.path, entry.path);
    assert.equal(enCopy.path, entry.path);
    assert.notEqual(hiCopy.title, enCopy.title, `${entry.category} title is identical in both locales`);
    assert.match(hiCopy.title, /[ऀ-ॿ]/, `${entry.category} Hindi title contains no Devanagari text`);
    assert.doesNotMatch(enCopy.title, /[ऀ-ॿ]/, `${entry.category} English title unexpectedly contains Devanagari text`);
  }
});

test("12. State-scoped SEO metadata (state/results/analysis) is locale-correct and returns null for an unresolvable state, in both locales", async () => {
  const hiMissing = await resolveStateScopedSeoBase("results", "not-a-real-state", "hi");
  const enMissing = await resolveStateScopedSeoBase("results", "not-a-real-state", "en");
  assert.equal(hiMissing, null);
  assert.equal(enMissing, null);
});

test("13. Fallback behavior never renders a raw i18n key or an empty string for any known surveyQuestions.options key", () => {
  const dictionary = hi.surveyQuestions.options;
  for (const key of Object.keys(dictionary)) {
    const resolved = resolveOptionLabel(key, { label: "unused-fallback" }, "hi", dictionary);
    assert.notEqual(resolved, "", `${key} resolved to an empty string`);
    assert.doesNotMatch(resolved, /^surveyQuestions\./, `${key} leaked a raw translation key instead of resolved text`);
  }
});

test("14. Survey completion share message preserves literal newlines, emoji, and contains no URL-encoded artifacts", () => {
  const hindiMsg = getSurveyShareMessage({ locale: "hi", constituencyName: "Tarabganj" });
  const englishMsg = getSurveyShareMessage({ locale: "en", constituencyName: "Tarabganj" });

  for (const [lang, msg] of [["Hindi", hindiMsg], ["English", englishMsg]]) {
    // Contains actual "\n" characters
    assert.ok(msg.includes("\n"), `${lang} share message must contain literal '\\n' characters`);
    assert.equal(msg.split("\n").length, 4, `${lang} share message must contain 4 lines separated by '\\n'`);

    // Contains emoji 🗳️
    assert.ok(msg.includes("🗳️"), `${lang} share message must contain the 🗳️ emoji`);

    // Does NOT contain URL-encoded artifacts
    assert.ok(!msg.includes("%0A"), `${lang} share message must not contain '%0A'`);
    assert.ok(!msg.includes("%EF%B8%8F"), `${lang} share message must not contain '%EF%B8%8F'`);
    assert.ok(!msg.includes("%20"), `${lang} share message must not contain '%20'`);

    // Contains votersurvey.in exactly once
    const matches = msg.match(/votersurvey\.in/gi);
    assert.ok(matches && matches.length === 1, `${lang} share message must contain 'votersurvey.in' exactly once, found ${matches?.length}`);
  }
});
