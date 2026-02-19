import { strict as assert } from "node:assert";
import { matchesGlob } from "../src/globMatcher";

describe("glob matcher", () => {
  it("matches recursive wildcard patterns", () => {
    assert.equal(matchesGlob("apps/web/.env", "**/.env*"), true);
    assert.equal(matchesGlob("apps/api/config/.env.local", "**/.env*"), true);
    assert.equal(matchesGlob("apps/api/env.local", "**/.env*"), false);
  });

  it("matches extension brace patterns", () => {
    const pattern = "**/*.{js,jsx,ts,tsx}";
    assert.equal(matchesGlob("src/app.ts", pattern), true);
    assert.equal(matchesGlob("src/app.tsx", pattern), true);
    assert.equal(matchesGlob("src/app.py", pattern), false);
  });

  it("handles simple single-segment wildcard patterns", () => {
    assert.equal(matchesGlob("src/foo/bar.ts", "src/*/*.ts"), true);
    assert.equal(matchesGlob("src/foo/bar/baz.ts", "src/*/*.ts"), false);
  });
});
