import * as path from "node:path";
import * as vscode from "vscode";
import { DIAGNOSTIC_CODES } from "./constants";
import { EnvWorkspaceService } from "./envWorkspaceService";
import {
  MissingExampleDiagnosticData,
  MissingInEnvDiagnosticData,
} from "./types";

function createMissingKeyCodeAction(
  diagnostic: vscode.Diagnostic,
  data: MissingInEnvDiagnosticData,
  targetDocument: vscode.TextDocument,
): vscode.CodeAction {
  const targetBasename = path.basename(targetDocument.uri.fsPath);
  const action = new vscode.CodeAction(
    `Add "${data.key}" to ${targetBasename}`,
    vscode.CodeActionKind.QuickFix,
  );
  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  const edit = new vscode.WorkspaceEdit();
  const text = targetDocument.getText();
  const insertPosition = targetDocument.positionAt(text.length);
  const prefix = text.length === 0 || text.endsWith("\n") ? "" : "\n";
  edit.insert(targetDocument.uri, insertPosition, `${prefix}${data.key}=\n`);
  action.edit = edit;
  return action;
}

function createMissingExampleCodeAction(
  diagnostic: vscode.Diagnostic,
  data: MissingExampleDiagnosticData,
): vscode.CodeAction {
  const action = new vscode.CodeAction(
    "Create .env.example from .env keys",
    vscode.CodeActionKind.QuickFix,
  );
  action.diagnostics = [diagnostic];
  const targetUri = vscode.Uri.parse(data.exampleUri);
  const edit = new vscode.WorkspaceEdit();
  edit.createFile(targetUri, { ignoreIfExists: true });

  const sortedKeys = [...new Set(data.keys)].sort();
  const content =
    sortedKeys.length > 0 ? `${sortedKeys.map((key) => `${key}=`).join("\n")}\n` : "";
  edit.insert(targetUri, new vscode.Position(0, 0), content);
  action.edit = edit;
  return action;
}

export class EnvCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  public constructor(private readonly service: EnvWorkspaceService) {}

  public async provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      const code = typeof diagnostic.code === "string" ? diagnostic.code : undefined;
      if (code === DIAGNOSTIC_CODES.missingInEnv) {
        const data = this.service.getDiagnosticData<MissingInEnvDiagnosticData>(
          document.uri,
          diagnostic,
        );
        if (!data?.targetEnvUri || !data.key) {
          continue;
        }

        try {
          const targetDocument = await vscode.workspace.openTextDocument(
            vscode.Uri.parse(data.targetEnvUri),
          );
          actions.push(createMissingKeyCodeAction(diagnostic, data, targetDocument));
        } catch (error) {
          console.error("[envis] Unable to load target .env for quick fix", error);
        }
      }

      if (code === DIAGNOSTIC_CODES.missingExample) {
        const data = this.service.getDiagnosticData<MissingExampleDiagnosticData>(
          document.uri,
          diagnostic,
        );
        if (!data?.exampleUri) {
          continue;
        }
        actions.push(createMissingExampleCodeAction(diagnostic, data));
      }
    }

    return actions;
  }
}
