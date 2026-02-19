import * as vscode from "vscode";
import { isEnvUri } from "./envFiles";
import { EnvWorkspaceService } from "./envWorkspaceService";
import { findNodeEnvKeyAtColumn } from "./nodeEnvKeyDetector";

export class EnvDefinitionProvider implements vscode.DefinitionProvider {
  public constructor(private readonly service: EnvWorkspaceService) {}

  public provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    if (isEnvUri(document.uri)) {
      return undefined;
    }

    if (!this.service.isPotentialReferenceUri(document.uri)) {
      return undefined;
    }

    const line = document.lineAt(position.line).text;
    const key = findNodeEnvKeyAtColumn(line, position.character);
    if (!key) {
      return undefined;
    }

    const definitions = this.service.getDefinitionLocations(key, document.uri);
    return definitions.length > 0 ? definitions : undefined;
  }
}
