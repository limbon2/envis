import { TextDecoder } from "node:util";
import * as vscode from "vscode";
import { minimatch } from "minimatch";
import { extractReferenceMatchesFromText } from "./referencePatterns";
import { EnvDocumentModel, EnvisSettings } from "./types";
import { discoverReferenceUris } from "./workspaceScanner";

function mapPush(map: Map<string, vscode.Location[]>, key: string, value: vscode.Location): void {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
}

function dedupeLocations(locations: vscode.Location[]): vscode.Location[] {
  const keys = new Set<string>();
  const deduped: vscode.Location[] = [];

  for (const location of locations) {
    const key = [
      location.uri.toString(),
      location.range.start.line,
      location.range.start.character,
      location.range.end.line,
      location.range.end.character,
    ].join(":");

    if (!keys.has(key)) {
      keys.add(key);
      deduped.push(location);
    }
  }

  return deduped;
}

function buildLineStarts(text: string): number[] {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      starts.push(index + 1);
    }
  }

  return starts;
}

function offsetToPosition(offset: number, lineStarts: number[]): vscode.Position {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lineStarts[mid] <= offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const line = Math.max(0, high);
  const character = offset - lineStarts[line];
  return new vscode.Position(line, character);
}

async function readUriText(uri: vscode.Uri): Promise<string> {
  const openDocument = vscode.workspace.textDocuments.find(
    (document) => document.uri.toString() === uri.toString(),
  );
  if (openDocument) {
    return openDocument.getText();
  }

  const content = await vscode.workspace.fs.readFile(uri);
  return new TextDecoder("utf-8").decode(content);
}

export class ReferenceEngine {
  private readonly usageByKey = new Map<string, vscode.Location[]>();
  private readonly definitionsByKey = new Map<string, vscode.Location[]>();

  public setEnvDefinitions(envFiles: EnvDocumentModel[]): void {
    this.definitionsByKey.clear();

    for (const envFile of envFiles) {
      for (const entry of envFile.orderedEntries) {
        const range = new vscode.Range(
          entry.line,
          entry.start,
          entry.line,
          entry.end,
        );
        mapPush(this.definitionsByKey, entry.key, new vscode.Location(envFile.uri, range));
      }
    }
  }

  public async refreshUsageIndex(settings: EnvisSettings): Promise<void> {
    this.usageByKey.clear();
    const files = await discoverReferenceUris(settings);

    for (const uri of files) {
      const text = await readUriText(uri);
      const lineStarts = buildLineStarts(text);

      for (const match of extractReferenceMatchesFromText(text)) {
        const location = new vscode.Location(
          uri,
          new vscode.Range(
            offsetToPosition(match.startOffset, lineStarts),
            offsetToPosition(match.endOffset, lineStarts),
          ),
        );
        mapPush(this.usageByKey, match.key, location);
      }
    }

    for (const [key, locations] of this.usageByKey) {
      this.usageByKey.set(key, dedupeLocations(locations));
    }
  }

  public getUsageCount(key: string): number {
    return (this.usageByKey.get(key) ?? []).length;
  }

  public getReferences(key: string, includeDeclarations: boolean): vscode.Location[] {
    const usage = this.usageByKey.get(key) ?? [];
    if (!includeDeclarations) {
      return usage;
    }

    const declarations = this.definitionsByKey.get(key) ?? [];
    return dedupeLocations([...declarations, ...usage]);
  }

  public isPotentialReferenceUri(uri: vscode.Uri, settings: EnvisSettings): boolean {
    if (uri.scheme !== "file") {
      return false;
    }

    const relativePath = vscode.workspace.asRelativePath(uri, false);
    return settings.referenceFileGlobs.some((glob) =>
      minimatch(relativePath, glob, {
        dot: true,
        nocase: false,
        windowsPathsNoEscape: true,
      }),
    );
  }
}
