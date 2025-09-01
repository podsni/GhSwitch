import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { run, exec } from "./utils/shell";
import { getSshDirectory, expandPath, normalizePath, platform } from "./utils/platform";

export const SSH_DIR = getSshDirectory();
export const SSH_CONFIG_PATH = path.join(SSH_DIR, "config");

export function ensureSshConfigBlock(alias: string, keyPath: string) {
  fs.mkdirSync(SSH_DIR, { recursive: true });
  
  // Set SSH directory permissions (Unix only)
  try {
    if (platform.isUnix) {
      fs.chmodSync(SSH_DIR, 0o700);
    }
  } catch {}
  
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
      const currentLine = lines[i];
      if (currentLine && currentLine.trim() === header) {
        out.push(block);
        i++;
        while (i < lines.length && lines[i] && !/^Host\s+/.test(lines[i]!)) i++;
        i--;
      } else if (currentLine !== undefined) {
        out.push(currentLine);
      }
    }
    fs.writeFileSync(SSH_CONFIG_PATH, out.join("\n").trim() + "\n", "utf8");
  } else {
    const sep = content && !content.endsWith("\n") ? "\n\n" : content ? "\n" : "";
    fs.writeFileSync(SSH_CONFIG_PATH, `${content}${sep}${block}\n`, "utf8");
  }
  ensureSshDirAndConfigPermissions();
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
  ensureSshDirAndConfigPermissions();
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
  ensureSshDirAndConfigPermissions();
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

export function ensureKeyPermissions(privateKeyPath: string) {
  try {
    fs.chmodSync(privateKeyPath, 0o600);
  } catch {}
  const pub = privateKeyPath + ".pub";
  if (fs.existsSync(pub)) {
    try { fs.chmodSync(pub, 0o644); } catch {}
  }
  ensureSshDirAndConfigPermissions();
}

export function ensureSshDirAndConfigPermissions() {
  try { fs.chmodSync(SSH_DIR, 0o700); } catch {}
  try {
    if (fs.existsSync(SSH_CONFIG_PATH)) fs.chmodSync(SSH_CONFIG_PATH, 0o600);
  } catch {}
}

export function listSshPrivateKeys() {
  try {
    const entries = fs.readdirSync(SSH_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => path.join(SSH_DIR, e.name))
      .filter((p) => !p.endsWith(".pub"))
      .filter((p) => !/\b(known_hosts|config|authorized_keys|authorized_keys2)\b/.test(path.basename(p)));
  } catch {
    return [];
  }
}

export function suggestDestFilenames(username?: string, label?: string) {
  const base = username || label || "github";
  const candidates = [
    `id_ed25519_${base}`,
    `id_ecdsa_${base}`,
    `id_rsa_${base}`,
    `id_ed25519_${(base + "").replace(/[^a-zA-Z0-9_-]+/g, "").toLowerCase()}`,
    `id_ed25519_github`,
  ];
  // de-dup
  return Array.from(new Set(candidates));
}
