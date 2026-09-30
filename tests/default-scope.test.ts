import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SCOPE_STATE, needsScopeRedirect, withDefaultScope } from "../src/lib/scoped-survey";

test("bare Result/Analysis URL defaults to Uttar Pradesh (all districts, all constituencies)", () => {
  assert.equal(DEFAULT_SCOPE_STATE, "uttar-pradesh");
  assert.deepEqual(withDefaultScope({}), { state: "uttar-pradesh" });
});

test("an explicitly selected state is never overridden", () => {
  assert.deepEqual(withDefaultScope({ state: "punjab" }), { state: "punjab" });
  assert.deepEqual(withDefaultScope({ state: "uttar-pradesh", district: "lucknow" }), { state: "uttar-pradesh", district: "lucknow" });
});

test("bare URL renders the default state in place; invalid scopes still redirect", () => {
  // /results → resolved to UP: no redirect.
  assert.equal(needsScopeRedirect({}, { state: "uttar-pradesh" }), false);
  // Default state missing from the DB → resolves to nothing: no redirect loop.
  assert.equal(needsScopeRedirect({}, {}), false);
  // Valid explicit scope: no redirect.
  assert.equal(needsScopeRedirect({ state: "punjab" }, { state: "punjab" }), false);
  // Unknown district dropped → redirect to the canonical state URL.
  assert.equal(needsScopeRedirect({ state: "punjab", district: "lucknow" }, { state: "punjab" }), true);
  // District without a state → not a bare URL, so it redirects to the resolved scope.
  assert.equal(needsScopeRedirect({ district: "lucknow" }, {}), true);
});
