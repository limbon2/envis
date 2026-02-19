import * as vscode from "vscode";
import { EnvCodeActionProvider } from "./envCodeActionProvider";
import { EnvCodeLensProvider } from "./envCodeLensProvider";
import { EnvDefinitionProvider } from "./envDefinitionProvider";
import { isEnvUri } from "./envFiles";
import { EnvReferenceProvider } from "./envReferenceProvider";
import { EnvWorkspaceService } from "./envWorkspaceService";

const ENV_SELECTOR: vscode.DocumentSelector = [{ scheme: "file", pattern: "**/.env*" }];
const SOURCE_SELECTOR: vscode.DocumentSelector = [{ scheme: "file" }];

function hasInterestingUri(
  uris: readonly vscode.Uri[],
  service: EnvWorkspaceService,
): boolean {
  return uris.some((uri) => isEnvUri(uri) || service.isPotentialReferenceUri(uri));
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const service = new EnvWorkspaceService();
  const codeLensProvider = new EnvCodeLensProvider(service);

  context.subscriptions.push(service, codeLensProvider);
  await service.initialize();

  context.subscriptions.push(
    vscode.commands.registerCommand("envis.scanWorkspace", async () => {
      await service.refreshAll();
      void vscode.window.showInformationMessage("Envis workspace scan complete.");
    }),
    vscode.commands.registerCommand("envis.refreshReferences", async () => {
      await service.refreshReferences();
      void vscode.window.showInformationMessage("Envis references refreshed.");
    }),
    vscode.commands.registerCommand("envis.toggleShowSiblingVariables", async () => {
      const config = vscode.workspace.getConfiguration("envis");
      const current = config.get<boolean>("references.showSiblingVariables", false);
      const next = !current;
      const hasWorkspaceFolders =
        (vscode.workspace.workspaceFolders?.length ?? 0) > 0;
      const target = hasWorkspaceFolders
        ? vscode.ConfigurationTarget.Workspace
        : vscode.ConfigurationTarget.Global;

      await config.update("references.showSiblingVariables", next, target);
      void vscode.window.showInformationMessage(
        next
          ? "Envis sibling env variables are now shown in references."
          : "Envis sibling env variables are now hidden in references.",
      );
    }),
    vscode.commands.registerCommand(
      "envis.showReferencesForEnvKey",
      async (uri: vscode.Uri, position: vscode.Position, key: string) => {
        const references = service.getReferences(key, true, uri);
        await vscode.commands.executeCommand(
          "editor.action.showReferences",
          uri,
          position,
          references,
        );
      },
    ),
    vscode.languages.registerCodeActionsProvider(
      ENV_SELECTOR,
      new EnvCodeActionProvider(service),
      { providedCodeActionKinds: EnvCodeActionProvider.providedCodeActionKinds },
    ),
    vscode.languages.registerReferenceProvider(
      ENV_SELECTOR,
      new EnvReferenceProvider(service),
    ),
    vscode.languages.registerDefinitionProvider(
      SOURCE_SELECTOR,
      new EnvDefinitionProvider(service),
    ),
    vscode.languages.registerCodeLensProvider(ENV_SELECTOR, codeLensProvider),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (isEnvUri(event.document.uri)) {
        service.scheduleEnvRefresh();
      }
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (isEnvUri(document.uri)) {
        service.scheduleEnvRefresh();
        return;
      }

      if (service.isPotentialReferenceUri(document.uri)) {
        service.scheduleReferenceRefresh();
      }
    }),
    vscode.workspace.onDidCreateFiles((event) => {
      if (hasInterestingUri(event.files, service)) {
        service.scheduleFullRefresh();
      }
    }),
    vscode.workspace.onDidDeleteFiles((event) => {
      if (hasInterestingUri(event.files, service)) {
        service.scheduleFullRefresh();
      }
    }),
    vscode.workspace.onDidRenameFiles((event) => {
      const uris = event.files.flatMap((item) => [item.oldUri, item.newUri]);
      if (hasInterestingUri(uris, service)) {
        service.scheduleFullRefresh();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      service.scheduleFullRefresh();
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("envis")) {
        service.scheduleFullRefresh();
      }
    }),
  );
}

export function deactivate(): void {
  // VS Code disposes subscriptions registered during activate.
}
