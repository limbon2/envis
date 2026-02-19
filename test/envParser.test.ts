import { strict as assert } from "node:assert";
import { parseEnvText } from "../src/envParser";

describe("parseEnvText", () => {
  it("parses keys, marks duplicates, and reports invalid keys", () => {
    const parsed = parseEnvText([
      "API_URL=https://example.com",
      "API_URL=https://duplicate.example.com",
      "INVALID-KEY=true",
      "NODE_ENV=production",
      "",
    ].join("\n"));

    assert.equal(parsed.entriesByKey.size, 2);
    assert.equal(parsed.entriesByKey.get("API_URL")?.length, 2);
    assert.equal(parsed.entriesByKey.get("NODE_ENV")?.length, 1);
    assert.equal(parsed.duplicates.length, 1);
    assert.equal(parsed.duplicates[0].key, "API_URL");
    assert.equal(parsed.invalidKeys.length, 1);
    assert.equal(parsed.invalidKeys[0].rawKey, "INVALID-KEY");
  });

  it("ignores comments, blank lines, and non-assignment lines", () => {
    const parsed = parseEnvText([
      "# comment",
      "",
      "some text",
      "VALID_KEY=1",
      "export EXPORTED_KEY=2",
    ].join("\n"));

    assert.equal(parsed.entriesByKey.size, 2);
    assert.ok(parsed.entriesByKey.has("VALID_KEY"));
    assert.ok(parsed.entriesByKey.has("EXPORTED_KEY"));
    assert.equal(parsed.invalidKeys.length, 0);
  });
});
