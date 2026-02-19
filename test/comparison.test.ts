import { strict as assert } from "node:assert";
import { compareEnvKeySets } from "../src/comparison";

describe("compareEnvKeySets", () => {
  it("returns missing and extra key sets", () => {
    const diff = compareEnvKeySets(
      ["API_URL", "NODE_ENV", "NEW_FLAG"],
      ["API_URL", "NODE_ENV", "LOCAL_ONLY"],
    );

    assert.deepEqual(diff.missingInEnv, ["NEW_FLAG"]);
    assert.deepEqual(diff.extraInEnv, ["LOCAL_ONLY"]);
  });

  it("returns empty arrays for fully matching sets", () => {
    const diff = compareEnvKeySets(["A", "B"], ["B", "A"]);
    assert.deepEqual(diff.missingInEnv, []);
    assert.deepEqual(diff.extraInEnv, []);
  });
});
