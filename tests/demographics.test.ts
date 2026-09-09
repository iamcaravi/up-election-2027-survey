// Structural check that the demographic question set never collects
// identifying information, and stays optional/skippable. No database
// needed — this only inspects the static enum definitions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AGE_GROUPS, GENDERS, SOCIAL_CATEGORIES, RELIGIONS, MIN_ANALYTICS_GROUP_SIZE_DEFAULT } from "../src/lib/enums";

const FORBIDDEN_PATTERNS = [
  /name/i,
  /phone/i,
  /email/i,
  /aadhaar/i,
  /voter.?id/i,
  /address/i,
  /gps/i,
  /location/i,
  /booth/i,
];

test("demographic option sets contain no identifying-field keys or labels", () => {
  for (const group of [AGE_GROUPS, GENDERS, SOCIAL_CATEGORIES, RELIGIONS]) {
    for (const option of group) {
      const text = `${option.key} ${option.label}`;
      for (const pattern of FORBIDDEN_PATTERNS) {
        assert.ok(!pattern.test(text), `Forbidden field pattern ${pattern} matched "${text}"`);
      }
    }
  }
});

test("minimum analytics group size defaults to 30", () => {
  assert.equal(MIN_ANALYTICS_GROUP_SIZE_DEFAULT, 30);
});
