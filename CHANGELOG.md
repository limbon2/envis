# Changelog

All notable changes to this project are documented in this file.

## [0.1.0] - 2026-02-19

### Added

- Initial Envis release.
- Recursive env file scanning for `.env`, `.env.example`, and `.env.*`.
- Diagnostics for:
  - missing `.env.example`
  - duplicate keys
  - missing keys in target env files
  - extra keys in target env files
  - invalid env key format
- Quick fixes for:
  - adding missing keys to env files
  - creating missing `.env.example` files
- Env reference indexing and key CodeLens counts.
- Find references and go-to-definition support for common Node and web env
  access patterns (`process.env` and `import.meta.env`).
- Syntax highlighting for env files, including `.env.*`.
- Configurable toggle to hide or show sibling `.env*` declarations in
  reference results.
