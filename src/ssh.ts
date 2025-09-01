import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { run, exec } from "./utils/shell";

export const SSH_DIR = path.join(os.homedir(), ".ssh");
export const SSH_CONFIG_PATH = path.join(SSH_DIR, "config");

export function ensureSshConfigBlock(alias: string, keyPath: string) {
  fs.mkdirSync(SSH_DIR, { recursive: true });
  let content = "";
  try {
    content = fs.readFileSync(SSH_CONFIG_PATH, "utf8");
  } catch {
    content = "";
  }
  const header = `Host ${alias}`;
  const block = [
    `Host ${alias}`,
    `  HostName github.com`,
    `  User git`,
    `  IdentityFile ${keyPath}`,
    `  IdentitiesOnly yes`,
  ].join("\n");

  if (content.split(/\r?\n/).some((line) => line.trim() === header)) {
    const lines = content.split(/\r?\n/);
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === header) {
        out.push(block);
        i++;
        while (i < lines.length && !/^Host\s+/.test(lines[i])) i++;
        i--;
      } else {
        out.push(lines[i]);
      }
    }
    fs.writeFileSync(SSH_CONFIG_PATH, out.join("\n").trim() + "\n", "utf8");
  } else {
    const sep = content && !content.endsWith("\n") ? "\n\n" : content ? "\n" : "";
    fs.writeFileSync(SSH_CONFIG_PATH, `${content}${sep}${block}\n`, "utf8");
  }
}

export async function generateSshKey(keyPath: string, comment: string) {
  const dir = path.dirname(keyPath);
  fs.mkdirSync(dir, { recursive: true });
  await run(["ssh-keygen", "-t", "ed25519", "-f", keyPath, "-C", comment, "-N", "" ]);
  try { fs.chmodSync(keyPath, 0o600); } catch {}
  const pub = keyPath + ".pub";
  if (fs.existsSync(pub)) {
    try { fs.chmodSync(pub, 0o644); } catch {}
  }
}

export function expandHome(p: string) {
  if (!p) return p;
  return p.replace(/^~(?=$|\/+)/, os.homedir());
}

export function importPrivateKey(srcPath: string, destPath: string) {
  const from = expandHome(srcPath);
  const to = expandHome(destPath);
  const dir = path.dirname(to);
  if (!fs.existsSync(from)) throw new Error(`Source key not found: ${from}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(from, to);
  fs.chmodSync(to, 0o600);
  return to;
}

export async function ensurePublicKey(privateKeyPath: string) {
  const pubPath = privateKeyPath + ".pub";
  if (fs.existsSync(pubPath)) return pubPath;
  const pub = await run(["ssh-keygen", "-y", "-f", privateKeyPath]);
  fs.writeFileSync(pubPath, pub.trim() + "\n", "utf8");
  try { fs.chmodSync(pubPath, 0o644); } catch {}
  return pubPath;
}

export async function testSshConnection(hostAlias: string) {
  const { code, stdout, stderr } = await exec([
    "ssh",
    "-T",
    "-o","StrictHostKeyChecking=no",
    "-o","ConnectTimeout=10",
    `git@${hostAlias}`,
  ]);
  const out = (stdout + "\n" + stderr).trim();
  const ok = /successfully authenticated|Hi\s+.+! You/.test(out);
  const hint = ok ? "SSH authentication ok" : `ssh exit ${code}`;
  return { ok: !!ok, message: out || hint };
}
