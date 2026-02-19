export interface EnvKeyDiff {
  missingInEnv: string[];
  extraInEnv: string[];
}

export function compareEnvKeySets(
  exampleKeys: Iterable<string>,
  envKeys: Iterable<string>,
): EnvKeyDiff {
  const example = new Set(exampleKeys);
  const env = new Set(envKeys);
  const missingInEnv: string[] = [];
  const extraInEnv: string[] = [];

  for (const key of example) {
    if (!env.has(key)) {
      missingInEnv.push(key);
    }
  }

  for (const key of env) {
    if (!example.has(key)) {
      extraInEnv.push(key);
    }
  }

  missingInEnv.sort();
  extraInEnv.sort();

  return {
    missingInEnv,
    extraInEnv,
  };
}
