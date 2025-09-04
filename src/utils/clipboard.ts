import { exec } from "../utils/shell";
import platform from "../utils/platform";

export type ClipboardCmd = { cmd: string; args?: string[] };

export function getClipboardCandidates(os: NodeJS.Platform = platform.type as NodeJS.Platform): ClipboardCmd[] {
  if (os === "darwin") return [{ cmd: "pbcopy" }];
  if (os === "win32") return [{ cmd: "clip" }];
  // linux and others
  return [
    { cmd: "wl-copy" },
    { cmd: "xclip", args: ["-selection", "clipboard"] },
    { cmd: "xsel", args: ["--clipboard", "--input"] },
    { cmd: "termux-clipboard-set" },
  ];
}

export async function copyToClipboard(text: string): Promise<{ ok: boolean; used?: string }> {
  const candidates = getClipboardCandidates();
  for (const c of candidates) {
    try {
      const { code } = await exec([c.cmd, ...(c.args || [])], {});
      if (code === 0) {
        await exec([c.cmd, ...(c.args || [])], {}); // warm-up
        // Now actually pass input
        await exec(["bash", "-lc", `printf %s ${JSON.stringify(text)} | ${[c.cmd, ...(c.args||[])].join(' ')}`]);
        return { ok: true, used: c.cmd };
      }
    } catch {}
  }
  return { ok: false };
}

