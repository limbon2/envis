# Envis

Envis is a VS Code extension that keeps your `.env` files and
`.env.example` files in sync, warns about common mistakes, and helps you find
where environment variables are used in code.

## What Envis does

Envis scans your workspace recursively and checks `.env`, `.env.example`, and
`.env.*` files. It then reports diagnostics and offers quick fixes.

- Warns when `.env.example` is missing in a folder that has `.env`.
- Warns when a file has duplicate keys.
- Compares env/example pairs and warns for:
  - keys missing in `.env`
  - keys present only in `.env`
- Offers quick fixes to:
  - add missing keys to `.env` as `KEY=`
  - create `.env.example` from `.env` keys
- Shows per-key CodeLens reference counts in env files.
- Supports `Find All References` for env keys in env files.
- Adds syntax highlighting for env keys in `.env` and `.env.*` files.

Envis compares both primary and variant pairs:

- `.env` with `.env.example`
- `.env.<variant>` with `.env.<variant>.example`

## Reference detection patterns

Envis uses heuristic scanning for references and detects:

- `process.env.KEY`
- `process.env["KEY"]` and `process.env['KEY']`
- `import.meta.env.KEY`
- `import.meta.env["KEY"]` and `import.meta.env['KEY']`
- `${KEY}`
- `env("KEY")` and `env('KEY')`

## Configuration

Envis supports these settings:

- `envis.scan.include`
  - Default: `["**/.env*"]`
  - Controls env file discovery globs.
- `envis.scan.exclude`
  - Default: `[]`
  - Adds custom ignore globs.
- `envis.diagnostics.missingExampleSeverity`
  - Default: `"warning"`
- `envis.diagnostics.missingKeySeverity`
  - Default: `"warning"`
- `envis.diagnostics.extraKeySeverity`
  - Default: `"warning"`
- `envis.diagnostics.duplicateKeySeverity`
  - Default: `"warning"`
- `envis.references.fileGlobs`
  - Default:
    `["**/*.{js,jsx,ts,tsx,mjs,cjs,vue,svelte,astro,py,go,rb,php,java,cs,sh,yml,yaml,json,md}"]`

By default, Envis ignores these directories:
`node_modules`, `.git`, `dist`, `build`, `out`, `.next`, `coverage`, `target`,
and `vendor`.

## Commands

- `Envis: Scan Workspace` (`envis.scanWorkspace`)
- `Envis: Refresh References` (`envis.refreshReferences`)

## Development

Use the commands below to build and test:

```bash
npm install
npm run check
```

`npm run check` runs TypeScript compilation and unit tests.
