import * as vscode from "vscode";
import { EnvWorkspaceService } from "./envWorkspaceService";

export class EnvReferenceProvider implements vscode.ReferenceProvider {
  public constructor(private readonly service: EnvWorkspaceService) {}

  public provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
  ): vscode.Location[] {
    const key = this.service.getKeyAtPosition(document, position);
    if (!key) {
      return [];
    }

    return this.service.getReferences(key, context.includeDeclaration);
  }
}
