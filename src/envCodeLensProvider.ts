import * as vscode from "vscode";
import { EnvWorkspaceService } from "./envWorkspaceService";

export class EnvCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
  private readonly onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  private readonly subscription: vscode.Disposable;

  public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

  public constructor(private readonly service: EnvWorkspaceService) {
    this.subscription = this.service.onDidUpdate(() => {
      this.onDidChangeCodeLensesEmitter.fire();
    });
  }

  public dispose(): void {
    this.subscription.dispose();
    this.onDidChangeCodeLensesEmitter.dispose();
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
  ): Promise<vscode.CodeLens[]> {
    const entries = this.service.getDocumentEntries(document);
    const firstEntryByKey = new Map<string, (typeof entries)[number]>();
    for (const entry of entries) {
      if (!firstEntryByKey.has(entry.key)) {
        firstEntryByKey.set(entry.key, entry);
      }
    }

    const codeLenses: vscode.CodeLens[] = [];
    for (const [key, entry] of firstEntryByKey.entries()) {
      const usageCount = this.service.getUsageCount(key);
      const title = `${usageCount} ${usageCount === 1 ? "reference" : "references"}`;
      const position = new vscode.Position(entry.line, entry.start);
      const range = new vscode.Range(position, position);

      codeLenses.push(
        new vscode.CodeLens(range, {
          title,
          command: "envis.showReferencesForEnvKey",
          arguments: [document.uri, position, key],
        }),
      );
    }

    return codeLenses;
  }
}
