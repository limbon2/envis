import { ENV_KEY_PATTERN } from "./constants";
import { ParsedEnvFile, ParsedEnvKey, ParsedInvalidKey } from "./types";

const ASSIGNMENT_PATTERN = /^\s*(?:export\s+)?([^=\s#]+)\s*=\s*(.*)$/;

export function parseEnvText(text: string): ParsedEnvFile {
  const entriesByKey = new Map<string, ParsedEnvKey[]>();
  const orderedEntries: ParsedEnvKey[] = [];
  const duplicates: ParsedEnvKey[] = [];
  const invalidKeys: ParsedInvalidKey[] = [];
  const lines = text.split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const match = line.match(ASSIGNMENT_PATTERN);
    if (!match) {
      continue;
    }

    const rawKey = match[1];
    const value = match[2] ?? "";
    const start = line.indexOf(rawKey);
    const end = start + rawKey.length;

    if (!ENV_KEY_PATTERN.test(rawKey)) {
      invalidKeys.push({ rawKey, line: index, start, end });
      continue;
    }

    const occurrence: ParsedEnvKey = {
      key: rawKey,
      value,
      line: index,
      start,
      end,
    };

    orderedEntries.push(occurrence);
    const items = entriesByKey.get(rawKey) ?? [];
    items.push(occurrence);
    entriesByKey.set(rawKey, items);

    if (items.length > 1) {
      duplicates.push(occurrence);
    }
  }

  return {
    entriesByKey,
    orderedEntries,
    duplicates,
    invalidKeys,
  };
}
