export interface NodeEnvKeyLineMatch {
  key: string;
  start: number;
  end: number;
}

const NODE_ENV_KEY_PATTERNS = [
  /process\.env\.([A-Z_][A-Z0-9_]*)/g,
  /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
  /import\.meta\.env\.([A-Z_][A-Z0-9_]*)/g,
  /import\.meta\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
];

export function extractNodeEnvKeyMatchesFromLine(line: string): NodeEnvKeyLineMatch[] {
  const matches: NodeEnvKeyLineMatch[] = [];

  for (const pattern of NODE_ENV_KEY_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match = regex.exec(line);

    while (match) {
      const key = match[1];
      const keyOffset = match[0].indexOf(key);
      if (keyOffset >= 0) {
        const start = match.index + keyOffset;
        matches.push({
          key,
          start,
          end: start + key.length,
        });
      }

      match = regex.exec(line);
    }
  }

  return matches.sort((left, right) => left.start - right.start);
}

export function findNodeEnvKeyAtColumn(
  line: string,
  column: number,
): string | undefined {
  const matches = extractNodeEnvKeyMatchesFromLine(line);
  for (const match of matches) {
    if (column >= match.start && column < match.end) {
      return match.key;
    }
  }

  return undefined;
}
