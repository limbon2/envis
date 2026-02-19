export interface ReferenceMatch {
  key: string;
  startOffset: number;
  endOffset: number;
}

const REFERENCE_PATTERNS = [
  /process\.env\.([A-Z_][A-Z0-9_]*)/g,
  /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
  /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
  /import\.meta\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
  /\$\{([A-Z_][A-Z0-9_]*)\}/g,
  /env\(\s*['"]([A-Z_][A-Z0-9_]*)['"]\s*\)/g,
];

export function extractReferenceMatchesFromText(text: string): ReferenceMatch[] {
  const matches: ReferenceMatch[] = [];

  for (const pattern of REFERENCE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match = regex.exec(text);

    while (match) {
      const key = match[1];
      const keyOffset = match[0].indexOf(key);
      if (keyOffset >= 0) {
        const startOffset = match.index + keyOffset;
        matches.push({
          key,
          startOffset,
          endOffset: startOffset + key.length,
        });
      }

      match = regex.exec(text);
    }
  }

  return matches;
}
