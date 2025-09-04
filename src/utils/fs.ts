import * as fs from "fs";
import * as path from "path";

export function listFilesRecursive(base: string = process.cwd(), opts: { max?: number; ignore?: string[] } = {}) {
  const max = opts.max ?? 200;
  const ignore = new Set([".git", "node_modules", ".next", "dist", "build", ...(opts.ignore || [])]);
  const out: string[] = [];
  function walk(dir: string) {
    if (out.length >= max) return;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= max) break;
      const name = e.name;
      if (ignore.has(name)) continue;
      const full = path.join(dir, name);
      if (e.isDirectory()) {
        walk(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  walk(base);
  return out;
}

