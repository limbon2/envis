import * as path from "node:path";
import { TextDecoder } from "node:util";
import * as vscode from "vscode";
import { compareEnvKeySets } from "./comparison";
import { DIAGNOSTIC_CODES, DIAGNOSTIC_SOURCE } from "./constants";
import {
  getExpectedExampleBasename,
  getExpectedEnvBasename,
  isEnvUri,
  parseEnvBasename,
} from "./envFiles";
import { parseEnvText } from "./envParser";
import { ReferenceEngine } from "./referenceEngine";
import { getSettings, toDiagnosticSeverity } from "./settings";
import {
  EnvDocumentModel,
  EnvFolderGroup,
  EnvisSettings,
  MissingExampleDiagnosticData,
  MissingInEnvDiagnosticData,
  ParsedEnvFile,
  ParsedEnvKey,
} from "./types";
import { discoverEnvUris } from "./workspaceScanner";

function rangeForEntry(entry: ParsedEnvKey): vscode.Range {
  return new vscode.Range(entry.line, entry.start, entry.line, entry.end);
}

function fallbackRange(): vscode.Range {
  return new vscode.Range(0, 0, 0, 0);
}

function setMapValue<T>(map: Map<string, T[]>, key: string, value: T): void {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
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

export class EnvWorkspaceService implements vscode.Disposable {
  private readonly diagnostics = vscode.languages.createDiagnosticCollection("envis");
  private readonly onDidUpdateEmitter = new vscode.EventEmitter<void>();
  private readonly referenceEngine = new ReferenceEngine();
  private readonly envByUri = new Map<string, EnvDocumentModel>();
  private readonly groupsByFolder = new Map<string, EnvFolderGroup>();
  private readonly diagnosticData = new Map<string, unknown>();

  private settings: EnvisSettings = getSettings();
  private refreshChain: Promise<void> = Promise.resolve();
  private envTimer: NodeJS.Timeout | undefined;
  private refsTimer: NodeJS.Timeout | undefined;
  private fullTimer: NodeJS.Timeout | undefined;

  public readonly onDidUpdate = this.onDidUpdateEmitter.event;

  public dispose(): void {
    if (this.envTimer) {
      clearTimeout(this.envTimer);
      this.envTimer = undefined;
    }
    if (this.refsTimer) {
      clearTimeout(this.refsTimer);
      this.refsTimer = undefined;
    }
    if (this.fullTimer) {
      clearTimeout(this.fullTimer);
      this.fullTimer = undefined;
    }
    this.onDidUpdateEmitter.dispose();
    this.diagnostics.dispose();
  }

  public async initialize(): Promise<void> {
    await this.refreshAll();
  }

  public async refreshAll(): Promise<void> {
    await this.enqueue(async () => {
      this.settings = getSettings();
      await this.refreshEnvStateInternal();
      await this.referenceEngine.refreshUsageIndex(this.settings);
      this.onDidUpdateEmitter.fire();
    });
  }

  public async refreshEnvState(): Promise<void> {
    await this.enqueue(async () => {
      this.settings = getSettings();
      await this.refreshEnvStateInternal();
      this.onDidUpdateEmitter.fire();
    });
  }

  public async refreshReferences(): Promise<void> {
    await this.enqueue(async () => {
      this.settings = getSettings();
      await this.referenceEngine.refreshUsageIndex(this.settings);
      this.onDidUpdateEmitter.fire();
    });
  }

  public scheduleEnvRefresh(delayMs = 250): void {
    if (this.envTimer) {
      clearTimeout(this.envTimer);
    }
    this.envTimer = setTimeout(() => {
      void this.refreshEnvState();
    }, delayMs);
  }

  public scheduleReferenceRefresh(delayMs = 600): void {
    if (this.refsTimer) {
      clearTimeout(this.refsTimer);
    }
    this.refsTimer = setTimeout(() => {
      void this.refreshReferences();
    }, delayMs);
  }

  public scheduleFullRefresh(delayMs = 400): void {
    if (this.fullTimer) {
      clearTimeout(this.fullTimer);
    }
    this.fullTimer = setTimeout(() => {
      void this.refreshAll();
    }, delayMs);
  }

  public getParsedDocument(uri: vscode.Uri): EnvDocumentModel | undefined {
    return this.envByUri.get(uri.toString());
  }

  public getDocumentEntries(document: vscode.TextDocument): ParsedEnvKey[] {
    const model = this.getParsedDocument(document.uri);
    if (model) {
      return model.orderedEntries;
    }

    return parseEnvText(document.getText()).orderedEntries;
  }

  public getKeyAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): string | undefined {
    const entries = this.getDocumentEntries(document);
    for (const entry of entries) {
      if (
        entry.line === position.line &&
        position.character >= entry.start &&
        position.character <= entry.end
      ) {
        return entry.key;
      }
    }

    const wordRange = document.getWordRangeAtPosition(position, /[A-Z_][A-Z0-9_]*/u);
    return wordRange ? document.getText(wordRange) : undefined;
  }

  public getUsageCount(key: string): number {
    return this.referenceEngine.getUsageCount(key);
  }

  public getReferences(key: string, includeDeclarations: boolean): vscode.Location[] {
    return this.referenceEngine.getReferences(key, includeDeclarations);
  }

  public getDiagnosticData<T>(
    documentUri: vscode.Uri,
    diagnostic: vscode.Diagnostic,
  ): T | undefined {
    const key = this.makeDiagnosticDataKey(documentUri.toString(), diagnostic);
    return this.diagnosticData.get(key) as T | undefined;
  }

  public isPotentialReferenceUri(uri: vscode.Uri): boolean {
    return this.referenceEngine.isPotentialReferenceUri(uri, this.settings);
  }

  private async enqueue(task: () => Promise<void>): Promise<void> {
    this.refreshChain = this.refreshChain.then(task).catch((error: unknown) => {
      console.error("[envis]", error);
    });
    return this.refreshChain;
  }

  private async refreshEnvStateInternal(): Promise<void> {
    this.envByUri.clear();
    this.groupsByFolder.clear();

    const envUris = await discoverEnvUris(this.settings);
    for (const uri of envUris) {
      const parsed = await this.parseFile(uri);
      const basename = path.basename(uri.fsPath);
      const folder = path.dirname(uri.fsPath);
      const keySet = new Set<string>(parsed.entriesByKey.keys());

      const model: EnvDocumentModel = {
        uri,
        basename,
        folder,
        keySet,
        ...parsed,
      };

      this.envByUri.set(uri.toString(), model);

      const existing = this.groupsByFolder.get(folder) ?? {
        folder,
        pairsByVariant: new Map(),
      };

      const info = parseEnvBasename(basename);
      if (info) {
        const pair = existing.pairsByVariant.get(info.variant) ?? {
          variant: info.variant,
        };
        if (info.kind === "env") {
          pair.env = model;
        } else {
          pair.example = model;
        }
        existing.pairsByVariant.set(info.variant, pair);
      }
      this.groupsByFolder.set(folder, existing);
    }

    this.referenceEngine.setEnvDefinitions([...this.envByUri.values()]);
    this.publishDiagnostics();
  }

  private async parseFile(uri: vscode.Uri): Promise<ParsedEnvFile> {
    try {
      const text = await readUriText(uri);
      return parseEnvText(text);
    } catch (error) {
      console.error("[envis] Failed to parse file", uri.fsPath, error);
      return parseEnvText("");
    }
  }

  private publishDiagnostics(): void {
    const diagnosticMap = new Map<string, vscode.Diagnostic[]>();
    this.diagnosticData.clear();
    const {
      duplicateKeySeverity,
      invalidKeySeverity,
      missingExampleSeverity,
      missingKeySeverity,
      extraKeySeverity,
    } = this.settings.diagnostics;

    for (const envFile of this.envByUri.values()) {
      for (const duplicate of envFile.duplicates) {
        const diagnostic = new vscode.Diagnostic(
          rangeForEntry(duplicate),
          `Duplicate key "${duplicate.key}" in ${envFile.basename}.`,
          toDiagnosticSeverity(duplicateKeySeverity),
        );
        diagnostic.code = DIAGNOSTIC_CODES.duplicateKey;
        diagnostic.source = DIAGNOSTIC_SOURCE;
        setMapValue(diagnosticMap, envFile.uri.toString(), diagnostic);
      }

      for (const invalid of envFile.invalidKeys) {
        const range = new vscode.Range(
          invalid.line,
          invalid.start,
          invalid.line,
          invalid.end,
        );
        const diagnostic = new vscode.Diagnostic(
          range,
          `Invalid key format "${invalid.rawKey}". Expected [A-Z_][A-Z0-9_]*.`,
          toDiagnosticSeverity(invalidKeySeverity),
        );
        diagnostic.code = DIAGNOSTIC_CODES.invalidKeyFormat;
        diagnostic.source = DIAGNOSTIC_SOURCE;
        setMapValue(diagnosticMap, envFile.uri.toString(), diagnostic);
      }
    }

    for (const group of this.groupsByFolder.values()) {
      const primaryPair = group.pairsByVariant.get("");
      if (primaryPair?.env && !primaryPair.example) {
        const expectedExampleUri = vscode.Uri.file(
          path.join(group.folder, ".env.example"),
        );
        const diagnostic = new vscode.Diagnostic(
          primaryPair.env.orderedEntries[0]
            ? rangeForEntry(primaryPair.env.orderedEntries[0])
            : fallbackRange(),
          "Missing .env.example in this folder.",
          toDiagnosticSeverity(missingExampleSeverity),
        );
        diagnostic.code = DIAGNOSTIC_CODES.missingExample;
        diagnostic.source = DIAGNOSTIC_SOURCE;
        const data: MissingExampleDiagnosticData = {
          envUri: primaryPair.env.uri.toString(),
          exampleUri: expectedExampleUri.toString(),
          keys: [...primaryPair.env.keySet].sort(),
        };
        this.setDiagnosticData(primaryPair.env.uri.toString(), diagnostic, data);
        setMapValue(diagnosticMap, primaryPair.env.uri.toString(), diagnostic);
      }

      for (const pair of group.pairsByVariant.values()) {
        if (!pair.env || !pair.example) {
          continue;
        }

        const envBasename = getExpectedEnvBasename(pair.variant);
        const exampleBasename = getExpectedExampleBasename(pair.variant);
        const diff = compareEnvKeySets(pair.example.keySet, pair.env.keySet);

        for (const key of diff.missingInEnv) {
          const sourceEntry = pair.example.entriesByKey.get(key)?.[0];
          const diagnostic = new vscode.Diagnostic(
            sourceEntry ? rangeForEntry(sourceEntry) : fallbackRange(),
            `Key "${key}" exists in ${exampleBasename} but is missing in ${envBasename}.`,
            toDiagnosticSeverity(missingKeySeverity),
          );
          diagnostic.code = DIAGNOSTIC_CODES.missingInEnv;
          diagnostic.source = DIAGNOSTIC_SOURCE;
          const data: MissingInEnvDiagnosticData = {
            key,
            targetEnvUri: pair.env.uri.toString(),
            sourceExampleUri: pair.example.uri.toString(),
          };
          this.setDiagnosticData(pair.example.uri.toString(), diagnostic, data);
          setMapValue(diagnosticMap, pair.example.uri.toString(), diagnostic);
        }

        for (const key of diff.extraInEnv) {
          const sourceEntry = pair.env.entriesByKey.get(key)?.[0];
          const diagnostic = new vscode.Diagnostic(
            sourceEntry ? rangeForEntry(sourceEntry) : fallbackRange(),
            `Key "${key}" exists in ${envBasename} but is not declared in ${exampleBasename}.`,
            toDiagnosticSeverity(extraKeySeverity),
          );
          diagnostic.code = DIAGNOSTIC_CODES.extraInEnv;
          diagnostic.source = DIAGNOSTIC_SOURCE;
          setMapValue(diagnosticMap, pair.env.uri.toString(), diagnostic);
        }
      }
    }

    this.diagnostics.clear();
    for (const [uriKey, diagnostics] of diagnosticMap) {
      this.diagnostics.set(vscode.Uri.parse(uriKey), diagnostics);
    }
  }

  private setDiagnosticData(
    uri: string,
    diagnostic: vscode.Diagnostic,
    data: unknown,
  ): void {
    const key = this.makeDiagnosticDataKey(uri, diagnostic);
    this.diagnosticData.set(key, data);
  }

  private makeDiagnosticDataKey(uri: string, diagnostic: vscode.Diagnostic): string {
    const code = typeof diagnostic.code === "string" ? diagnostic.code : "";
    return [
      uri,
      code,
      diagnostic.range.start.line,
      diagnostic.range.start.character,
      diagnostic.range.end.line,
      diagnostic.range.end.character,
      diagnostic.message,
    ].join("|");
  }
}

export function isEnvDocument(document: vscode.TextDocument): boolean {
  return isEnvUri(document.uri);
}
