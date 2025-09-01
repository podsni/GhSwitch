import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { AppConfig } from "./types";

export const CONFIG_DIR = process.env.XDG_CONFIG_HOME
  ? path.join(process.env.XDG_CONFIG_HOME, "github-switch")
  : path.join(os.homedir(), ".config", "github-switch");

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

