import * as path from "node:path";
import * as vscode from "vscode";
import { minimatch } from "minimatch";
import { DEFAULT_IGNORED_DIRECTORIES, ENV_FILE_PATTERN } from "./constants";

export function isEnvBasename(name: string): boolean {
  return ENV_FILE_PATTERN.test(name);
}

export function isEnvUri(uri: vscode.Uri): boolean {
  return uri.scheme === "file" && isEnvBasename(path.basename(uri.fsPath));
}

export function isExampleBasename(name: string): boolean {
  return name === ".env.example";
}

export function isPrimaryEnvBasename(name: string): boolean {
  return name === ".env";
}

export function isIgnoredByDefault(uri: vscode.Uri): boolean {
  const segments = uri.fsPath.split(path.sep);
  return segments.some((segment) => DEFAULT_IGNORED_DIRECTORIES.has(segment));
}

export function isExcludedByPattern(uri: vscode.Uri, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return false;
  }

  const relative = vscode.workspace.asRelativePath(uri, false);
  return patterns.some((pattern) =>
    minimatch(relative, pattern, {
      dot: true,
      nocase: false,
      windowsPathsNoEscape: true,
    }),
  );
}

export function shouldSkipUri(uri: vscode.Uri, patterns: string[]): boolean {
  return isIgnoredByDefault(uri) || isExcludedByPattern(uri, patterns);
}
