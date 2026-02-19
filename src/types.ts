import * as vscode from "vscode";

export type SeveritySetting = "error" | "warning" | "information" | "hint";

export interface EnvisSettings {
  scanInclude: string[];
  scanExclude: string[];
  diagnostics: {
    missingExampleSeverity: SeveritySetting;
    missingKeySeverity: SeveritySetting;
    extraKeySeverity: SeveritySetting;
    duplicateKeySeverity: SeveritySetting;
    invalidKeySeverity: SeveritySetting;
  };
  referenceFileGlobs: string[];
}

export interface ParsedEnvKey {
  key: string;
  value: string;
  line: number;
  start: number;
  end: number;
}

export interface ParsedInvalidKey {
  rawKey: string;
  line: number;
  start: number;
  end: number;
}

export interface ParsedEnvFile {
  entriesByKey: Map<string, ParsedEnvKey[]>;
  orderedEntries: ParsedEnvKey[];
  duplicates: ParsedEnvKey[];
  invalidKeys: ParsedInvalidKey[];
}

export interface EnvDocumentModel extends ParsedEnvFile {
  uri: vscode.Uri;
  basename: string;
  folder: string;
  keySet: Set<string>;
}

export interface EnvVariantPair {
  variant: string;
  env?: EnvDocumentModel;
  example?: EnvDocumentModel;
}

export interface EnvFolderGroup {
  folder: string;
  pairsByVariant: Map<string, EnvVariantPair>;
}

export interface MissingInEnvDiagnosticData {
  key: string;
  targetEnvUri: string;
  sourceExampleUri: string;
}

export interface MissingExampleDiagnosticData {
  envUri: string;
  exampleUri: string;
  keys: string[];
}
