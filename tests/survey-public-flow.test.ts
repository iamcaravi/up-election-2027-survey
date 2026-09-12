import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import en from "../src/lib/i18n/locales/en";
import hi from "../src/lib/i18n/locales/hi";
import { isCandidateEligibleForSurveyParty } from "../src/lib/survey-eligibility";
import {
  buildPublicSurveyAnswers,
  changePartySelection,
  getCandidatesForSelectedParty,
} from "../src/lib/survey-public-flow";

const repoRoot = path.resolve(__dirname, "..");
const flowSource = readFileSync(path.join(repoRoot, "src/components/survey/SurveyFlow.tsx"), "utf8");
const cardSource = readFileSync(path.join(repoRoot, "src/components/candidate/CandidateCard.tsx"), "utf8");

const bjp = { key: "bjp", partyId: "party-bjp", isSpecialParty: false };
const sp = { key: "sp", partyId: "party-sp", isSpecialParty: false };
const other = { key: "other", partyId: "party-other", isSpecialParty: true };
const undecided = { key: "undecided", partyId: "party-undecided", isSpecialParty: true };
const candidates = [
  { slug: "bjp-candidate", partyId: "party-bjp" },
  { slug: "sp-candidate", partyId: "party-sp" },
];

test("1. party preference appears before candidate preference", () => {
  assert.match(flowSource, /\["party_preference", "candidate_choice", "top_issue", "demographics", "complete"\]/);
  assert.match(flowSource, /useState<Step>\("party_preference"\)/);
});

test("2. party preference is rendered as required", () => {
  assert.match(flowSource, /name="party_preference"[\s\S]*?required/);
  assert.match(flowSource, /t\.common\.required/);
});

test("3. party preference has no Skip control", () => {
  const partyBlock = flowSource.slice(flowSource.indexOf('step === "party_preference"'), flowSource.indexOf('step === "candidate_choice"'));
  assert.ok(!partyBlock.includes("t.common.skip"));
});

test("4. candidate selection is hidden before a party is selected", () => {
  assert.match(flowSource, /step === "candidate_choice" && selectedParty && !selectedParty\.isSpecialParty/);
});

test("5. selecting BJP exposes only BJP candidates", () => {
  assert.deepEqual(getCandidatesForSelectedParty(bjp, candidates).map((candidate) => candidate.slug), ["bjp-candidate"]);
});

test("6. selecting SP does not expose BJP candidates", () => {
  assert.deepEqual(getCandidatesForSelectedParty(sp, candidates).map((candidate) => candidate.slug), ["sp-candidate"]);
});

for (const [number, status] of [[7, "INCUMBENT"], [8, "HISTORICAL"], [9, "OTHER"]] as const) {
  test(`${number}. ${status} candidates are excluded by the shared eligibility rule`, () => {
    assert.equal(isCandidateEligibleForSurveyParty("election", "constituency", "party-bjp", {
      electionId: "election",
      constituencyId: "constituency",
      partyId: "party-bjp",
      status,
      isActive: true,
    }), false);
  });
}

test("10. Other party hides candidate selection", () => {
  assert.deepEqual(getCandidatesForSelectedParty(other, candidates), []);
});

test("11. Undecided hides candidate selection", () => {
  assert.deepEqual(getCandidatesForSelectedParty(undecided, candidates), []);
});

test("12. changing BJP to SP clears the BJP candidate answer", () => {
  assert.deepEqual(changePartySelection({ party_preference: "bjp", candidate_choice: "bjp-candidate" }, "sp"), {
    party_preference: "sp",
  });
});

test("13. an ordinary party with zero candidates has a graceful continuation state", () => {
  assert.deepEqual(getCandidatesForSelectedParty(bjp, []), []);
  assert.match(hi.vote.noCandidates, /आगे बढ़ सकते हैं/);
  assert.match(flowSource, /role="status"/);
});

test("14. an ordinary party with candidates requires a candidate", () => {
  assert.throws(() => buildPublicSurveyAnswers({ party_preference: "bjp" }, bjp, candidates, true));
});

test("15. synthetic Other Candidate is available only when real eligible candidates exist", () => {
  assert.doesNotThrow(() => buildPublicSurveyAnswers(
    { party_preference: "bjp", candidate_choice: "other" }, bjp, candidates, true
  ));
  const zeroCandidatePayload = buildPublicSurveyAnswers(
    { party_preference: "bjp", candidate_choice: "other" }, bjp, [], true
  );
  assert.ok(!zeroCandidatePayload.some((answer) => answer.questionKey === "candidate_choice"));
});

test("16. Other and Undecided submissions omit candidate_choice", () => {
  for (const party of [other, undecided]) {
    const payload = buildPublicSurveyAnswers(
      { party_preference: party.key, candidate_choice: "bjp-candidate" }, party, candidates, true
    );
    assert.ok(!payload.some((answer) => answer.questionKey === "candidate_choice"));
  }
});

test("17. an ordinary party and its candidate submit both correct answers", () => {
  assert.deepEqual(buildPublicSurveyAnswers(
    { party_preference: "bjp", candidate_choice: "bjp-candidate" }, bjp, candidates, true
  ), [
    { questionKey: "party_preference", optionKey: "bjp" },
    { questionKey: "candidate_choice", optionKey: "bjp-candidate" },
  ]);
});

test("18. party and candidate cards use keyboard-accessible native radios", () => {
  assert.match(flowSource, /type="radio"[\s\S]*?name="party_preference"/);
  assert.match(cardSource, /<motion\.label/);
  assert.match(cardSource, /type="radio"/);
  assert.match(cardSource, /onChange=\{onSelect\}/);
  assert.ok(!cardSource.includes("onClick={onSelect}"));
});

test("19. Hindi party, candidate, required and empty-state copy is available", () => {
  assert.equal(hi.vote.partyQuestion, "अगर आज विधानसभा चुनाव हों तो आप किस पार्टी को वोट देना पसंद करेंगे?");
  assert.equal(hi.vote.candidateQuestion, "2027 में आप अपने क्षेत्र से किसे विधायक देखना चाहते हैं?");
  assert.ok(hi.common.required);
  assert.ok(hi.vote.noCandidates);
  assert.equal(hi.surveyQuestions.options.rojgar, "रोजगार");
});

test("20. English party, candidate, required and empty-state copy is available", () => {
  assert.equal(en.vote.partyQuestion, "If assembly elections were held today, which party would you prefer to vote for?");
  assert.equal(en.vote.candidateQuestion, "Who would you like to see as the MLA from your constituency in 2027?");
  assert.ok(en.common.required);
  assert.ok(en.vote.noCandidates);
  assert.equal(en.surveyQuestions.topIssue, "What is the biggest issue in your constituency?");
  assert.equal(en.surveyQuestions.options.rojgar, "Employment");
});
