export const EXTENSION_ID = "envis";
export const DIAGNOSTIC_SOURCE = "envis";

export const DIAGNOSTIC_CODES = {
  missingExample: "envis.missingExample",
  duplicateKey: "envis.duplicateKey",
  missingInEnv: "envis.missingInEnv",
  extraInEnv: "envis.extraInEnv",
  invalidKeyFormat: "envis.invalidKeyFormat",
} as const;

export const DEFAULT_SCAN_INCLUDE = ["**/.env*"];
export const DEFAULT_SCAN_EXCLUDE = [];

export const DEFAULT_REFERENCE_FILE_GLOBS = [
  "**/*.{js,jsx,ts,tsx,mjs,cjs,vue,svelte,astro,py,go,rb,php,java,cs,sh,yml,yaml,json,md}",
];

export const DEFAULT_IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  ".next",
  "coverage",
  "target",
  "vendor",
]);

export const ENV_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/;

export const ENV_FILE_PATTERN = /^\.env(?:\..+)?$/;
