import { describe, it, expect } from "bun:test";
import { suggestDestFilenames, expandHome } from "./ssh";
import os from "os";

describe("ssh helpers", () => {
  it("suggests candidate filenames with sanitization and dedup", () => {
    const names = suggestDestFilenames("User Name!", "work");
    // contains sanitized lowercase variant and common patterns
    expect(names.some(n => n.startsWith("id_ed25519_"))).toBe(true);
    expect(new Set(names).size).toBe(names.length); // de-dup
  });

  it("expands ~ to homedir", () => {
    const home = os.homedir();
    const p = expandHome("~/.ssh/id_ed25519");
    expect(p.startsWith(home)).toBe(true);
  });
});

