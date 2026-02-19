import { strict as assert } from "node:assert";
import { extractReferenceMatchesFromText } from "../src/referencePatterns";

describe("extractReferenceMatchesFromText", () => {
  it("finds env references across supported patterns", () => {
    const text = [
      "const a = process.env.API_URL;",
      "const b = process.env['NODE_ENV'];",
      "const c = import.meta.env.PUBLIC_URL;",
      "const d = import.meta.env['FEATURE_FLAG'];",
      "const e = `${BUILD_ID}`;",
      "const f = env('DATABASE_URL');",
    ].join("\n");

    const keys = extractReferenceMatchesFromText(text).map((match) => match.key);
    assert.deepEqual(
      keys.sort(),
      [
        "API_URL",
        "NODE_ENV",
        "PUBLIC_URL",
        "FEATURE_FLAG",
        "BUILD_ID",
        "DATABASE_URL",
      ].sort(),
    );
  });

  it("returns empty for text without recognized patterns", () => {
    const keys = extractReferenceMatchesFromText("console.log('hello world');");
    assert.equal(keys.length, 0);
  });
});
