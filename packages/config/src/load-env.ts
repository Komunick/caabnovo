import { existsSync } from "node:fs";
import { dirname, parse, resolve } from "node:path";

function findNearestEnv(startDirectory: string): string | undefined {
  let directory = resolve(startDirectory);
  const root = parse(directory).root;

  while (true) {
    const candidate = resolve(directory, ".env");
    if (existsSync(candidate)) return candidate;
    if (directory === root) return undefined;
    directory = dirname(directory);
  }
}

export function loadWorkspaceEnv(startDirectory = process.cwd()): string | undefined {
  const envPath = process.env.DOTENV_CONFIG_PATH
    ? resolve(startDirectory, process.env.DOTENV_CONFIG_PATH)
    : findNearestEnv(startDirectory);
  if (envPath) process.loadEnvFile(envPath);
  return envPath;
}
