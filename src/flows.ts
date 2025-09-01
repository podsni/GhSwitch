import prompts from "prompts";
import { bold } from "kleur/colors";
import * as fs from "fs";

import type { AppConfig, Account } from "./types";
import { saveConfig } from "./config";
import {
  ensureCredentialStore,
  getRemoteUrl,
  isGitRepo,
  parseRepoFromUrl,
  setLocalGitIdentity,
  setRemoteUrl,
  withGitSuffix,
} from "./git";
import { ensureSshConfigBlock, expandHome, generateSshKey, importPrivateKey, ensurePublicKey, testSshConnection, listSshPrivateKeys, suggestDestFilenames, SSH_DIR, ensureKeyPermissions } from "./ssh";
import { testTokenAuth } from "./git";

export async function chooseAccount(accounts: Account[]) {
  const { idx } = await prompts({
    type: "select",
    name: "idx",
    message: "Choose account",
    choices: accounts.map((a, i) => ({ title: a.name, value: i })),
  });
  if (idx === undefined) return null;
  return accounts[idx];
}

export async function addAccountFlow(cfg: AppConfig) {
  const base = await prompts([
    { type: "text", name: "name", message: "Account label (e.g., work, personal)", validate: (v) => !!v || "Required" },
    { type: "text", name: "gitUserName", message: "Git user.name (optional)" },
    { type: "text", name: "gitEmail", message: "Git user.email (optional)" },
    { type: "multiselect", name: "methods", message: "Enable methods", choices: [
      { title: "SSH", value: "ssh" },
      { title: "Token (HTTPS)", value: "token" },
    ], min: 1 },
  ]);
  if (!base.name) return;

  const acc: Account = { name: base.name, gitUserName: base.gitUserName || undefined, gitEmail: base.gitEmail || undefined };

  if (base.methods.includes("ssh")) {
    const existingKeys = listSshPrivateKeys();
    const keyChoices = [
      ...existingKeys.map((p) => ({ title: p, value: p })),
      { title: "Ketik path kunci manual…", value: "__manual__" },
    ];
    const sel = await prompts([
      { type: keyChoices.length ? "autocomplete" : "text", name: "keySel", message: "Pilih SSH key di ~/.ssh atau ketik manual", choices: keyChoices },
    ]);
    let keyPath: string | undefined;
    if (sel.keySel && sel.keySel !== "__manual__") {
      keyPath = expandHome(sel.keySel);
    } else {
      const manual = await prompts([
        { type: "text", name: "keyPath", message: "SSH key path (mis. ~/.ssh/id_ed25519_work)", validate: (v) => !!v || "Required" },
      ]);
      keyPath = expandHome(manual.keyPath);
    }
    const more = await prompts([
      { type: "text", name: "hostAlias", message: "SSH host alias (opsional)", initial: `github-${base.name}` },
      { type: (!keyPath || !fs.existsSync(keyPath)) ? "confirm" : null, name: "gen", message: "Key tidak ditemukan. Generate baru (ed25519)?" },
    ]);
    const alias = more.hostAlias || `github-${base.name}`;
    acc.ssh = { keyPath: keyPath!, hostAlias: alias };
    if (keyPath && fs.existsSync(keyPath)) {
      ensureKeyPermissions(keyPath);
    }
    if (keyPath && !fs.existsSync(keyPath) && more.gen) {
      await generateSshKey(keyPath, base.gitEmail || base.gitUserName || `${base.name}@github`);
      console.log(bold("Generated SSH key:"), keyPath);
      const pub = keyPath + ".pub";
      if (fs.existsSync(pub)) console.log("Public key:", pub);
    }
  }

  if (base.methods.includes("token")) {
    const tokenAns = await prompts([
      { type: "text", name: "username", message: "GitHub username" },
      { type: "password", name: "token", message: "GitHub Personal Access Token" },
    ]);
    acc.token = { username: tokenAns.username, token: tokenAns.token };
  }

  cfg.accounts.push(acc);
  saveConfig(cfg);
  console.log(bold("Account saved:"), acc.name);
}

export async function removeAccountFlow(cfg: AppConfig) {
  if (!cfg.accounts.length) return console.log("No accounts to remove.");
  const { idx } = await prompts({
    type: "select",
    name: "idx",
    message: "Remove which account?",
    choices: cfg.accounts.map((a, i) => ({ title: a.name, value: i })),
  });
  if (idx === undefined) return;
  const [removed] = cfg.accounts.splice(idx, 1);
  saveConfig(cfg);
  console.log(bold("Removed:"), removed.name);
}

export async function listAccounts(cfg: AppConfig) {
  if (!cfg.accounts.length) return console.log("No accounts configured.");
  for (const a of cfg.accounts) {
    console.log(`- ${a.name}:`);
    if (a.gitUserName) console.log(`  user.name: ${a.gitUserName}`);
    if (a.gitEmail) console.log(`  user.email: ${a.gitEmail}`);
    if (a.ssh) console.log(`  SSH: ${a.ssh.hostAlias ?? `github-${a.name}`} -> ${a.ssh.keyPath}`);
    if (a.token) console.log(`  Token: username=${a.token.username} (token stored)`);
  }
}

export async function switchForCurrentRepo(cfg: AppConfig) {
  const cwd = process.cwd();
  if (!(await isGitRepo(cwd))) {
    console.log("Not a git repository. cd into a repo and try again.");
    return;
  }
  if (!cfg.accounts.length) {
    console.log("No accounts configured yet.");
    return;
  }
  const acc = await chooseAccount(cfg.accounts);
  if (!acc) return;

  const methods = [
    ...(acc.ssh ? [{ title: "SSH", value: "ssh" as const }] : []),
    ...(acc.token ? [{ title: "Token (HTTPS)", value: "token" as const }] : []),
  ];
  if (!methods.length) {
    console.log("Selected account has no methods configured.");
    return;
  }
  const { method } = await prompts({ type: methods.length === 1 ? null : "select", name: "method", message: "Choose method", choices: methods });
  const chosen = (methods.length === 1 ? methods[0].value : method) as "ssh" | "token";

  let remoteUrl = await getRemoteUrl("origin", cwd);
  let repoPath = parseRepoFromUrl(remoteUrl || "");
  if (!repoPath) {
    const ans = await prompts({ type: "text", name: "repo", message: "owner/repo (current repository)", validate: (v) => /.+\/.+/.test(v) ? true : "Use owner/repo" });
    if (!ans.repo) return;
    repoPath = withGitSuffix(ans.repo);
  }
  repoPath = withGitSuffix(repoPath);

  if (chosen === "ssh" && acc.ssh) {
    const keyPath = expandHome(acc.ssh.keyPath);
    if (!fs.existsSync(keyPath)) {
      const { gen } = await prompts({ type: "confirm", name: "gen", message: `SSH key not found at ${keyPath}. Generate now?` });
      if (gen) {
        await generateSshKey(keyPath, acc.gitEmail || acc.gitUserName || `${acc.name}@github`);
        console.log(bold("Generated SSH key:"), keyPath);
      } else {
        console.log("Aborted.");
        return;
      }
    }
    // Ensure permissions and use Host github.com (no alias) for simpler usage
    ensureKeyPermissions(keyPath);
    ensureSshConfigBlock("github.com", keyPath);
    const newUrl = `git@github.com:${repoPath}`;
    await setRemoteUrl(newUrl, "origin", cwd);
    await setLocalGitIdentity(acc.gitUserName, acc.gitEmail, cwd);
    console.log(bold("Switched origin to SSH using Host github.com"));
    console.log("Remote:", newUrl);
    console.log("Git identity set (repo-local)");
    return;
  }

  if (chosen === "token" && acc.token) {
    const httpsUrl = `https://github.com/${repoPath}`;
    await setRemoteUrl(httpsUrl, "origin", cwd);
    await setLocalGitIdentity(acc.gitUserName, acc.gitEmail, cwd);
    await ensureCredentialStore(acc.token.username, acc.token.token);
    console.log(bold("Switched origin to HTTPS (token)"));
    console.log("Remote:", httpsUrl);
    console.log("Stored token for github.com in ~/.git-credentials (plaintext)");
    console.log("Security note: consider using SSH for stronger local security.");
    return;
  }
}

export async function editAccountFlow(cfg: AppConfig) {
  if (!cfg.accounts.length) return console.log("No accounts to edit.");
  const acc = await chooseAccount(cfg.accounts);
  if (!acc) return;

  const methodsInit: string[] = [];
  if (acc.ssh) methodsInit.push("ssh");
  if (acc.token) methodsInit.push("token");

  const base = await prompts([
    { type: "text", name: "name", message: "Account label", initial: acc.name, validate: (v) => !!v || "Required" },
    { type: "text", name: "gitUserName", message: "Git user.name", initial: acc.gitUserName || "" },
    { type: "text", name: "gitEmail", message: "Git user.email", initial: acc.gitEmail || "" },
    { type: "multiselect", name: "methods", message: "Enable methods", choices: [
      { title: "SSH", value: "ssh" },
      { title: "Token (HTTPS)", value: "token" },
    ], initial: methodsInit },
  ]);
  if (!base.name) return;

  acc.name = base.name;
  acc.gitUserName = base.gitUserName || undefined;
  acc.gitEmail = base.gitEmail || undefined;

  const useSsh = base.methods.includes("ssh");
  const useTok = base.methods.includes("token");
  acc.ssh = useSsh ? acc.ssh ?? { keyPath: "", hostAlias: `github-${acc.name}` } : undefined;
  acc.token = useTok ? acc.token ?? { username: "", token: "" } : undefined;

  if (useSsh && acc.ssh) {
    const sshAns = await prompts([
      { type: "text", name: "keyPath", message: "SSH key path", initial: acc.ssh.keyPath || "~/.ssh/id_ed25519_" + acc.name },
      { type: "text", name: "hostAlias", message: "SSH host alias", initial: acc.ssh.hostAlias || `github-${acc.name}` },
      { type: (prev: string) => (prev && !fs.existsSync(expandHome(prev)) ? "confirm" : null), name: "gen", message: "Key not found. Generate new ed25519 key?" },
    ]);
    acc.ssh.keyPath = expandHome(sshAns.keyPath);
    acc.ssh.hostAlias = sshAns.hostAlias || `github-${acc.name}`;
    if (!fs.existsSync(acc.ssh.keyPath) && sshAns.gen) {
      await generateSshKey(acc.ssh.keyPath, acc.gitEmail || acc.gitUserName || `${acc.name}@github`);
    }
  }

  if (useTok && acc.token) {
    const tokAns = await prompts([
      { type: "text", name: "username", message: "GitHub username", initial: acc.token.username || "" },
      { type: "password", name: "token", message: "GitHub token (leave blank to keep)" },
    ]);
    acc.token.username = tokAns.username || acc.token.username;
    if (tokAns.token) acc.token.token = tokAns.token;
  }

  saveConfig(cfg);
  console.log(bold("Updated account:"), acc.name);
}

export async function importSshKeyFlow(cfg: AppConfig) {
  if (!cfg.accounts.length) return console.log("No accounts. Add one first.");
  const acc = await chooseAccount(cfg.accounts);
  if (!acc) return;

  const existingKeys = listSshPrivateKeys();
  const srcChoices = existingKeys.map((p) => ({ title: p, value: p }));
  const destSugs = suggestDestFilenames(acc.token?.username, acc.name);
  const destChoices = destSugs.map((n) => ({ title: `${SSH_DIR}/${n}`, value: n }));

  const ans = await prompts([
    { type: "text", name: "username", message: "GitHub username untuk key ini", initial: acc.token?.username || "" },
    { type: srcChoices.length ? "autocomplete" : "text", name: "src", message: "Pilih/isi path private key yang sudah ada", choices: srcChoices },
    { type: destChoices.length ? "autocomplete" : "text", name: "dest", message: "Nama file tujuan di ~/.ssh", choices: destChoices, initial: destSugs[0] || `id_ed25519_${acc.name}` , validate: (v: string) => (v && !/[\/]/.test(v)) || "Masukkan nama file saja, tanpa path" },
    { type: "confirm", name: "makeDefault", message: "Jadikan default (Host github.com) sekarang?", initial: true },
    { type: "confirm", name: "writeAlias", message: "Tambahkan juga alias Host khusus (opsional)?", initial: false },
    { type: (prev: boolean) => (prev ? "text" : null), name: "alias", message: "Nama alias Host", initial: (_: string, values: any) => `github-${values.username || acc.name}` },
    { type: "confirm", name: "test", message: "Test SSH connection setelah import?", initial: true },
  ]);
  if (!ans.src || !ans.dest) return;
  const destFull = `${SSH_DIR}/${ans.dest}`;
  // Cegah overwrite tanpa konfirmasi jika file sudah ada
  if (fs.existsSync(destFull)) {
    const { overwrite } = await prompts({ type: "confirm", name: "overwrite", message: `${destFull} sudah ada. Timpa?`, initial: false });
    if (!overwrite) return console.log("Dibatalkan.");
  }
  const imported = importPrivateKey(ans.src, destFull);
  const pub = await ensurePublicKey(imported);

  acc.ssh = {
    keyPath: imported,
    hostAlias: ans.alias || `github-${ans.username || acc.name}`,
  };
  if (ans.makeDefault) {
    ensureSshConfigBlock("github.com", acc.ssh.keyPath);
    console.log(bold("Set as default Host github.com"));
  }
  if (ans.writeAlias && ans.alias) {
    ensureSshConfigBlock(acc.ssh.hostAlias!, acc.ssh.keyPath);
    console.log(bold(`Alias Host ditambahkan: ${acc.ssh.hostAlias}`));
  }
  saveConfig(cfg);
  console.log(bold("Imported SSH key:"), imported);
  console.log("Public key:", pub);

  if (ans.test) {
    const host = ans.makeDefault ? "github.com" : (ans.writeAlias && ans.alias ? ans.alias : (acc.ssh.hostAlias || "github.com"));
    const res = await testSshConnection(host);
    console.log(res.ok ? bold(`SSH test OK (${host})`) : bold(`SSH test FAILED (${host})`));
    console.log(res.message);
  }
}

export async function testConnectionFlow(cfg: AppConfig) {
  if (!cfg.accounts.length) return console.log("No accounts. Add one first.");
  const acc = await chooseAccount(cfg.accounts);
  if (!acc) return;
  const methods = [
    ...(acc.ssh ? [{ title: "SSH", value: "ssh" as const }] : []),
    ...(acc.token ? [{ title: "Token", value: "token" as const }] : []),
  ];
  if (!methods.length) return console.log("Selected account has no methods configured.");
  const { method } = await prompts({ type: methods.length === 1 ? null : "select", name: "method", message: "Test which method?", choices: methods });
  const chosen = (methods.length === 1 ? methods[0].value : method) as "ssh" | "token";

  if (chosen === "ssh" && acc.ssh) {
    const res = await testSshConnection(acc.ssh.hostAlias!);
    console.log(res.ok ? bold("SSH test OK") : bold("SSH test FAILED"));
    console.log(res.message);
  } else if (chosen === "token" && acc.token) {
    const res = await testTokenAuth(acc.token.username, acc.token.token);
    console.log(res.ok ? bold("Token test OK") : bold("Token test FAILED"));
    console.log(res.message);
  }
}

export async function switchGlobalSshFlow(cfg: AppConfig) {
  if (!cfg.accounts.length) return console.log("No accounts. Add one first.");
  const acc = await chooseAccount(cfg.accounts);
  if (!acc) return;
  if (!acc.ssh) return console.log("Selected account has no SSH configured.");

  const keyPath = expandHome(acc.ssh.keyPath);
  if (!fs.existsSync(keyPath)) {
    const { gen } = await prompts({ type: "confirm", name: "gen", message: `SSH key not found at ${keyPath}. Generate now?` });
    if (gen) {
      await generateSshKey(keyPath, acc.gitEmail || acc.gitUserName || `${acc.name}@github`);
    } else {
      console.log("Aborted.");
      return;
    }
  }

  // Ensure strict permissions and set global host to always use this key for github.com
  ensureKeyPermissions(keyPath);
  ensureSshConfigBlock("github.com", keyPath);
  console.log(bold("Updated ~/.ssh/config → Host github.com using:"), keyPath);

  const { doTest } = await prompts({ type: "confirm", name: "doTest", message: "Test SSH connection now?", initial: true });
  if (doTest) {
    const res = await testSshConnection("github.com");
    console.log(res.ok ? bold("SSH test OK") : bold("SSH test FAILED"));
    console.log(res.message);
  }
}
