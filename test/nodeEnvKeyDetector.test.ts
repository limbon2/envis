import { strict as assert } from "node:assert";
import {
  extractNodeEnvKeyMatchesFromLine,
  findNodeEnvKeyAtColumn,
} from "../src/nodeEnvKeyDetector";

describe("node env key detector", () => {
  it("extracts keys from process.env and import.meta.env patterns", () => {
    const line =
      "const a = process.env.API_URL + import.meta.env['PUBLIC_BASE_URL'];";
    const keys = extractNodeEnvKeyMatchesFromLine(line).map((match) => match.key);

    assert.deepEqual(keys.sort(), ["API_URL", "PUBLIC_BASE_URL"].sort());
  });

  it("finds key at column for dot notation", () => {
    const line = "console.log(process.env.NODE_ENV);";
    const column = line.indexOf("NODE_ENV") + 2;
    assert.equal(findNodeEnvKeyAtColumn(line, column), "NODE_ENV");
  });

  it("finds key at column for bracket notation", () => {
    const line = "const mode = process.env['APP_MODE'];";
    const column = line.indexOf("APP_MODE") + 3;
    assert.equal(findNodeEnvKeyAtColumn(line, column), "APP_MODE");
  });

  it("returns undefined when column is not on an env key", () => {
    const line = "const mode = process.env['APP_MODE'];";
    const column = line.indexOf("process");
    assert.equal(findNodeEnvKeyAtColumn(line, column), undefined);
  });

  it("returns undefined for dynamic env access", () => {
    const line = "const value = process.env[keyName];";
    const column = line.indexOf("keyName") + 1;
    assert.equal(findNodeEnvKeyAtColumn(line, column), undefined);
  });
});
