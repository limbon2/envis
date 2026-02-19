import * as vscode from "vscode";
import {
  DEFAULT_REFERENCE_FILE_GLOBS,
  DEFAULT_SCAN_EXCLUDE,
  DEFAULT_SCAN_INCLUDE,
} from "./constants";
import { EnvisSettings, SeveritySetting } from "./types";

function asArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const values = value.filter((entry): entry is string => typeof entry === "string");
  return values.length > 0 ? values : fallback;
}

function asSeverity(value: unknown, fallback: SeveritySetting): SeveritySetting {
  if (
    value === "error" ||
    value === "warning" ||
    value === "information" ||
    value === "hint"
  ) {
    return value;
  }

  return fallback;
}

export function getSettings(): EnvisSettings {
  const config = vscode.workspace.getConfiguration("envis");
  const diagnostics = config.get("diagnostics") ?? {};

  return {
    scanInclude: asArray(config.get("scan.include"), DEFAULT_SCAN_INCLUDE),
    scanExclude: asArray(config.get("scan.exclude"), DEFAULT_SCAN_EXCLUDE),
    diagnostics: {
      missingExampleSeverity: asSeverity(
        (diagnostics as Record<string, unknown>).missingExampleSeverity,
        "warning",
      ),
      missingKeySeverity: asSeverity(
        (diagnostics as Record<string, unknown>).missingKeySeverity,
        "warning",
      ),
      extraKeySeverity: asSeverity(
        (diagnostics as Record<string, unknown>).extraKeySeverity,
        "warning",
      ),
      duplicateKeySeverity: asSeverity(
        (diagnostics as Record<string, unknown>).duplicateKeySeverity,
        "warning",
      ),
      invalidKeySeverity: "warning",
    },
    referenceFileGlobs: asArray(
      config.get("references.fileGlobs"),
      DEFAULT_REFERENCE_FILE_GLOBS,
    ),
  };
}

export function toDiagnosticSeverity(value: SeveritySetting): vscode.DiagnosticSeverity {
  switch (value) {
    case "error":
      return vscode.DiagnosticSeverity.Error;
    case "information":
      return vscode.DiagnosticSeverity.Information;
    case "hint":
      return vscode.DiagnosticSeverity.Hint;
    case "warning":
    default:
      return vscode.DiagnosticSeverity.Warning;
  }
}
