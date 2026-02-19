export interface EnvBasenameInfo {
  variant: string;
  kind: "env" | "example";
}

export function getExpectedEnvBasename(variant: string): string {
  return variant ? `.env.${variant}` : ".env";
}

export function getExpectedExampleBasename(variant: string): string {
  return variant ? `.env.${variant}.example` : ".env.example";
}

export function parseEnvBasename(name: string): EnvBasenameInfo | undefined {
  if (name === ".env") {
    return { variant: "", kind: "env" };
  }

  if (name === ".env.example") {
    return { variant: "", kind: "example" };
  }

  if (!name.startsWith(".env.")) {
    return undefined;
  }

  const suffix = name.slice(".env.".length);
  if (suffix.length === 0) {
    return undefined;
  }

  if (suffix.endsWith(".example")) {
    const variant = suffix.slice(0, -".example".length);
    if (variant.length === 0) {
      return undefined;
    }

    return { variant, kind: "example" };
  }

  return { variant: suffix, kind: "env" };
}
