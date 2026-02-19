const regexCache = new Map<string, RegExp>();

function escapeRegexChar(character: string): string {
  return /[\\^$+?.()|[\]{}]/u.test(character) ? `\\${character}` : character;
}

function findClosingBrace(pattern: string, start: number): number {
  let depth = 0;
  for (let index = start; index < pattern.length; index += 1) {
    if (pattern[index] === "{") {
      depth += 1;
    } else if (pattern[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function splitBraceOptions(content: string): string[] {
  const options: string[] = [];
  let depth = 0;
  let current = "";

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === "," && depth === 0) {
      options.push(current);
      current = "";
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
    }
    current += character;
  }

  options.push(current);
  return options;
}

function toRegexSource(pattern: string): string {
  let source = "";

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];

    if (character === "\\") {
      source += "/";
      continue;
    }

    if (character === "/") {
      source += "/";
      continue;
    }

    if (character === "*") {
      const next = pattern[index + 1];
      if (next === "*") {
        while (pattern[index + 1] === "*") {
          index += 1;
        }

        if (pattern[index + 1] === "/") {
          index += 1;
          source += "(?:.*/)?";
        } else {
          source += ".*";
        }
      } else {
        source += "[^/]*";
      }
      continue;
    }

    if (character === "?") {
      source += "[^/]";
      continue;
    }

    if (character === "{") {
      const closing = findClosingBrace(pattern, index);
      if (closing > index) {
        const content = pattern.slice(index + 1, closing);
        const options = splitBraceOptions(content)
          .map((item) => toRegexSource(item))
          .join("|");
        source += `(?:${options})`;
        index = closing;
        continue;
      }
    }

    source += escapeRegexChar(character);
  }

  return source;
}

function getRegex(pattern: string): RegExp {
  const existing = regexCache.get(pattern);
  if (existing) {
    return existing;
  }

  const regex = new RegExp(`^${toRegexSource(pattern)}$`, "u");
  regexCache.set(pattern, regex);
  return regex;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function matchesGlob(path: string, pattern: string): boolean {
  return getRegex(normalizePath(pattern)).test(normalizePath(path));
}
