import { strict as assert } from "node:assert";
import {
  getExpectedEnvBasename,
  getExpectedExampleBasename,
  parseEnvBasename,
} from "../src/envBasename";

describe("env basename parsing", () => {
  it("parses primary env and example names", () => {
    assert.deepEqual(parseEnvBasename(".env"), { variant: "", kind: "env" });
    assert.deepEqual(parseEnvBasename(".env.example"), {
      variant: "",
      kind: "example",
    });
  });

  it("parses variant env and example names", () => {
    assert.deepEqual(parseEnvBasename(".env.staging"), {
      variant: "staging",
      kind: "env",
    });
    assert.deepEqual(parseEnvBasename(".env.staging.example"), {
      variant: "staging",
      kind: "example",
    });
    assert.deepEqual(parseEnvBasename(".env.local.us-east-1.example"), {
      variant: "local.us-east-1",
      kind: "example",
    });
  });

  it("returns expected basenames for variants", () => {
    assert.equal(getExpectedEnvBasename(""), ".env");
    assert.equal(getExpectedExampleBasename(""), ".env.example");
    assert.equal(getExpectedEnvBasename("staging"), ".env.staging");
    assert.equal(
      getExpectedExampleBasename("staging"),
      ".env.staging.example",
    );
  });

  it("returns undefined for unsupported names", () => {
    assert.equal(parseEnvBasename(".env."), undefined);
    assert.equal(parseEnvBasename(".env..example"), undefined);
    assert.equal(parseEnvBasename("not-env"), undefined);
  });
});
