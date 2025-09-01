import * as fs from "fs";
import * as path from "path";
import type { AppConfig } from "./types";
import { getConfigDirectory } from "./utils/platform";

export const CONFIG_DIR = getConfigDirectory("github-switch");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function loadConfig(): AppConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as AppConfig;
    if (!parsed.accounts) return { accounts: [] };
    return parsed;
  } catch {
    return { accounts: [] };
  }
}

export function saveConfig(cfg: AppConfig) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n", "utf8");
}

