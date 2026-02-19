# Publishing guide

This guide explains exactly how to publish Envis on GitHub and the VS Code
Marketplace. Follow these steps once to set things up, then use the release
workflow for each new version.

## What is already configured

The repository now includes:

- CI workflow: `.github/workflows/ci.yml`
- Release and marketplace workflow:
  `.github/workflows/publish-marketplace.yml`
- Packaging scripts in `package.json`
- Marketplace packaging include rules in `package.json` (`files` field)
- Changelog file: `CHANGELOG.md`
- Extension icon: `media/icon.png`

## One-time setup

Before the first publish, complete these setup steps.

1. Create a GitHub repository and push this code.
2. Create a VS Code Marketplace publisher.
3. Verify `publisher` in `package.json` matches your Marketplace publisher ID.
4. Create a Marketplace Personal Access Token.
5. In GitHub, add repository secret `VSCE_PAT` with that token.

## Local preflight

Run this command before you tag a release:

```bash
npm ci
npm run ci
```

`npm run ci` builds, tests, and creates a `.vsix` file locally.

## Versioning and release flow

Use this sequence for each release:

1. Update `version` in `package.json`.
2. Add release notes to `CHANGELOG.md`.
3. Commit and push to `main`.
4. Create and push a tag like `v0.1.1`.

```bash
git tag v0.1.1
git push origin v0.1.1
```

When you push the tag:

- GitHub Actions builds and tests the extension.
- GitHub Actions packages the VSIX and attaches it to a GitHub release.
- GitHub Actions publishes to the VS Code Marketplace using `VSCE_PAT`.

## Manual publish from GitHub Actions

If you need a manual publish, run the **publish-marketplace** workflow and set
the `publish` input to `true`.

## Common troubleshooting

If publishing fails, check these first:

- `VSCE_PAT` is missing or expired.
- `publisher` in `package.json` does not match your Marketplace publisher.
- The `version` already exists on Marketplace.
- The tag and `package.json` version do not match your intended release.

## Next steps

After your first successful release, add the GitHub repository URL fields in
`package.json` (`repository`, `bugs`, and `homepage`) so Marketplace cards link
directly to your project pages.
