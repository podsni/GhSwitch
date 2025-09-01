import * as os from "os";
import * as fs from "fs";
import { run, exec } from "./utils/shell";
import { getGitCredentialsPath } from "./utils/platform";

const GIT_CREDENTIALS = getGitCredentialsPath();

export async function isGitRepo(cwd: string) {
  try {
    await run(["git", "rev-parse", "--is-inside-work-tree"], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function getGitRoot(cwd: string) {
  try {
    const root = await run(["git", "rev-parse", "--show-toplevel"], { cwd });
    return root;
  } catch {
    return null;
  }
}

export async function getRemoteUrl(remote = "origin", cwd = process.cwd()) {
  try {
    return await run(["git", "remote", "get-url", remote], { cwd });
  } catch {
    return null;
  }
}

export function parseRepoFromUrl(url: string | null) {
  if (!url) return null;
  let m = url.match(/^git@[^:]+:([^\s]+)$/);
  if (m && m[1]) return m[1].replace(/^\/+/, "");
  m = url.match(/^ssh:\/\/[^/]+\/(.+)$/);
  if (m && m[1]) return m[1];
  m = url.match(/^https?:\/\/[^/]+\/(.+)$/);
  if (m && m[1]) return m[1];
  return null;
}

export async function setRemoteUrl(newUrl: string, remote = "origin", cwd = process.cwd()) {
  await run(["git", "remote", "set-url", remote, newUrl], { cwd });
}

export async function setLocalGitIdentity(userName?: string, email?: string, cwd = process.cwd()) {
  if (userName) await run(["git", "config", "user.name", userName], { cwd });
  if (email) await run(["git", "config", "user.email", email], { cwd });
}

export function withGitSuffix(repo: string) {
  return repo.endsWith(".git") ? repo : `${repo}.git`;
}

export async function ensureCredentialStore(username: string, token: string) {
  try {
    await run(["git", "config", "credential.helper", "store"]);
  } catch {}
  let existing = "";
  try {
    existing = fs.readFileSync(GIT_CREDENTIALS, "utf8");
  } catch {
    existing = "";
  }
  const lines = existing.split(/\r?\n/).filter(Boolean);
  const filtered = lines.filter((l) => !l.includes("@github.com"));
  filtered.push(`https://${encodeURIComponent(username)}:${encodeURIComponent(token)}@github.com`);
  fs.writeFileSync(GIT_CREDENTIALS, filtered.join("\n") + "\n", "utf8");
}

export async function testTokenAuth(username: string, token: string) {
  const { stdout } = await exec([
    "curl",
    "-s",
    "-o", "/dev/null",
    "-w", "%{http_code}",
    "-u", `${username}:${token}`,
    "https://api.github.com/user",
  ]);
  const code = (stdout || "").trim();
  const ok = code === "200";
  return { ok, message: `HTTP ${code}` };
}

export async function getCurrentGitUser(cwd = process.cwd()) {
  try {
    const userName = await run(["git", "config", "user.name"], { cwd });
    const userEmail = await run(["git", "config", "user.email"], { cwd });
    return { userName: userName.trim(), userEmail: userEmail.trim() };
  } catch {
    return null;
  }
}

export async function getCurrentRemoteInfo(cwd = process.cwd()) {
  try {
    const remoteUrl = await getRemoteUrl("origin", cwd);
    const repoPath = parseRepoFromUrl(remoteUrl || "");
    const isSSH = remoteUrl?.startsWith("git@") || false;
    return { 
      remoteUrl, 
      repoPath: repoPath?.replace(/\.git$/, ""), 
      authType: isSSH ? "ssh" : "https" 
    };
  } catch {
    return null;
  }
}
