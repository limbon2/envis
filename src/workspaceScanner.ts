import * as path from "node:path";
import * as vscode from "vscode";
import { isEnvBasename, isEnvUri, shouldSkipUri } from "./envFiles";
import { EnvisSettings } from "./types";

function dedupeUris(uris: vscode.Uri[]): vscode.Uri[] {
  const byKey = new Map<string, vscode.Uri>();
  for (const uri of uris) {
    byKey.set(uri.toString(), uri);
  }

  return [...byKey.values()].sort((left, right) =>
    left.fsPath.localeCompare(right.fsPath),
  );
}

async function discoverByGlobs(globs: string[]): Promise<vscode.Uri[]> {
  const tasks = globs.map((glob) => vscode.workspace.findFiles(glob));
  const results = await Promise.all(tasks);
  return results.flat();
}

export async function discoverEnvUris(settings: EnvisSettings): Promise<vscode.Uri[]> {
  const candidates = dedupeUris(await discoverByGlobs(settings.scanInclude));

  return candidates.filter(
    (uri) =>
      uri.scheme === "file" &&
      isEnvBasename(path.basename(uri.fsPath)) &&
      !shouldSkipUri(uri, settings.scanExclude),
  );
}

export async function discoverReferenceUris(
  settings: EnvisSettings,
): Promise<vscode.Uri[]> {
  const candidates = dedupeUris(await discoverByGlobs(settings.referenceFileGlobs));
  return candidates.filter(
    (uri) =>
      uri.scheme === "file" &&
      !isEnvUri(uri) &&
      !shouldSkipUri(uri, settings.scanExclude),
  );
}
