# Envis extension status

This document summarizes what is implemented and verified in the current Envis
extension build, and what remains as follow-up work.

## Working now

The items below are implemented and available in the extension code.

### Env file discovery and validation

- Recursively discovers `.env`, `.env.example`, and `.env.*` files in workspace
  folders.
- Applies built-in directory ignores for common dependency and build output
  paths.
- Warns when `.env` exists without `.env.example` in the same folder.
- Warns for duplicate keys within a single env file.
- Warns for invalid key format when key does not match:
  `[A-Z_][A-Z0-9_]*`.
- Cross-checks `.env.example` against `.env` and reports:
  - keys missing in target env file
  - keys extra in target env file
- Supports pair matching for:
  - `.env` and `.env.example`
  - `.env.<variant>` and `.env.<variant>.example`

### Quick fixes

- Missing key quick fix:
  - From `.env.example` diagnostic, inserts `KEY=` into sibling `.env`.
- Missing example quick fix:
  - Creates `.env.example` from current `.env` keys.

### References and editor integrations

- Reference scan runs with heuristic pattern matching across configured source
  globs.
- Supports `Find All References` on keys in env files.
- Supports go-to-definition from code (Ctrl/Cmd+Click) for:
  - `process.env.KEY` and bracket variants
  - `import.meta.env.KEY` and bracket variants
- Hides sibling `.env*` declarations from references by default, with a toggle
  to show them.
- Shows CodeLens above each key with usage count and click-through references.
- Provides key-focused syntax highlighting for `.env` and `.env.*` files.
- Refreshes data from editor/workspace events and configuration changes.

### Tests and verification

- Unit tests cover:
  - parser behavior (valid keys, duplicates, invalid keys)
  - key diff logic (`.env` vs `.env.example`)
  - reference pattern extraction
  - Node/import-meta env key detection for go-to-definition
- Validation command passes:
  - `npm run check` (TypeScript build + tests)

### Packaging and release automation

- Includes extension packaging scripts for local `.vsix` creation and
  Marketplace publishing.
- Uses the `files` field in `package.json` for clean VSIX contents.
- Includes CI workflow for build, test, and package validation.
- Includes release workflow for tag-based GitHub release asset creation and VS
  Code Marketplace publish.
- Includes a publishing runbook at `docs/publishing.md`.

## Left to do

The items below are not implemented yet or can be improved in a future
iteration.

### Product and behavior improvements

- Add optional "sync all missing keys" quick action for a folder pair.
- Add richer parser support for advanced dotenv syntax edge cases.
- Add severity setting for invalid key format diagnostics.
- Add optional behavior to copy example values into `.env` instead of
  placeholder-only insertion.

### Reference intelligence improvements

- Add language-aware reference providers where available and keep heuristic
  fallback.
- Add support for more framework-specific env access patterns.
- Add indexing cache by file content hash for very large repositories.

### Testing and release hardening

- Add VS Code extension-host integration tests for diagnostics and quick fixes.
- Add tests for multi-root workspaces and large monorepo scenarios.

## Snapshot date

This status reflects the codebase state as of February 19, 2026.
