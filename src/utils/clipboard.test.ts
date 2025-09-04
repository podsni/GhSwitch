import { describe, it, expect } from "bun:test";
import { getClipboardCandidates } from "./clipboard";

describe("clipboard candidates", () => {
  it("darwin uses pbcopy", () => {
    const c = getClipboardCandidates("darwin");
    expect(c[0].cmd).toBe("pbcopy");
  });
  it("win32 uses clip", () => {
    const c = getClipboardCandidates("win32");
    expect(c[0].cmd).toBe("clip");
  });
  it("linux prefers wl-copy/xclip/xsel", () => {
    const c = getClipboardCandidates("linux");
    const cmds = c.map(x=>x.cmd);
    expect(cmds.includes("wl-copy")).toBe(true);
    expect(cmds.includes("xclip")).toBe(true);
    expect(cmds.includes("xsel")).toBe(true);
  });
});

