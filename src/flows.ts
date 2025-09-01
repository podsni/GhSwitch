import prompts from "prompts";
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
  getCurrentGitUser,
  getCurrentRemoteInfo,
} from "./git";
import { ensureSshConfigBlock, expandHome, generateSshKey, importPrivateKey, ensurePublicKey, testSshConnection, listSshPrivateKeys, suggestDestFilenames, SSH_DIR, ensureKeyPermissions } from "./ssh";
import { testTokenAuth } from "./git";
import { 
  showSection, 
  showAccount, 
  showList, 
  stylePrompt, 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo,
  showBox,
  showRepoStatus,
  createSpinner,
  colors 
} from "./utils/ui";

export async function detectActiveAccount(accounts: Account[], cwd = process.cwd()): Promise<string | null> {
  try {
    // Check if we're in a git repository
    if (!(await isGitRepo(cwd))) {
      return null;
    }

    // Get current git user and remote info
    const gitUser = await getCurrentGitUser(cwd);
    const remoteInfo = await getCurrentRemoteInfo(cwd);

    if (!gitUser && !remoteInfo) {
      return null;
    }

    // Try to match account based on git identity and remote URL
    for (const account of accounts) {
      let matches = 0;
      let totalChecks = 0;

      // Check git identity match
      if (gitUser) {
        if (account.gitUserName) {
          totalChecks++;
          if (gitUser.userName === account.gitUserName) matches++;
        }
        if (account.gitEmail) {
          totalChecks++;
          if (gitUser.userEmail === account.gitEmail) matches++;
        }
      }

      // Check remote URL type match (SSH vs HTTPS)
      if (remoteInfo) {
        totalChecks++;
        if (remoteInfo.authType === "ssh" && account.ssh) {
          matches++;
        } else if (remoteInfo.authType === "https" && account.token) {
          matches++;
        }
      }

      // If we have matches and they represent a significant portion
      if (matches > 0 && matches >= Math.ceil(totalChecks * 0.5)) {
        return account.name;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function chooseAccount(accounts: Account[]) {
  // Detect active account
  const activeAccountName = await detectActiveAccount(accounts);
  
  const { idx } = await prompts({
    type: "select",
    name: "idx",
    message: stylePrompt("Choose account"),
    choices: accounts.map((a, i) => {
      const isActive = a.name === activeAccountName;
      const statusIcon = isActive ? colors.success("●") : colors.muted("○");
      const statusText = isActive ? colors.success(" (ACTIVE)") : "";
      
      // Build description with available methods
      const methods = [];
      if (a.ssh) methods.push("SSH");
      if (a.token) methods.push("Token");
      const methodsText = methods.length > 0 ? ` • ${methods.join(", ")}` : "";
      
      return {
        title: `${statusIcon} ${a.name}${statusText}`,
        value: i,
        description: `${a.gitEmail || a.gitUserName || "No git identity"}${methodsText}`
      };
    }),
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
      showSuccess(`Generated SSH key: ${keyPath}`);
      const pub = keyPath + ".pub";
      if (fs.existsSync(pub)) showInfo(`Public key: ${pub}`);
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
  showSuccess(`Account saved: ${acc.name}`);
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
  showSuccess(`Removed account: ${removed?.name || 'Unknown'}`);
}

export async function listAccounts(cfg: AppConfig) {
  if (!cfg.accounts.length) {
    showWarning("No accounts configured. Please add an account first.");
    return;
  }
  
  showSection("Account Overview");
  
  // Detect active account
  const activeAccountName = await detectActiveAccount(cfg.accounts);
  
  // Show repository info if we're in a git repo
  const cwd = process.cwd();
  if (await isGitRepo(cwd)) {
    const remoteInfo = await getCurrentRemoteInfo(cwd);
    const gitUser = await getCurrentGitUser(cwd);
    
    if (remoteInfo || gitUser) {
      showBox(
        [
          remoteInfo ? `Repository: ${colors.accent(remoteInfo.repoPath || 'Unknown')}` : '',
          remoteInfo ? `Auth Type: ${colors.secondary(remoteInfo.authType?.toUpperCase() || 'Unknown')}` : '',
          gitUser ? `Git User: ${colors.text(gitUser.userName || 'Not set')}` : '',
          gitUser ? `Git Email: ${colors.text(gitUser.userEmail || 'Not set')}` : '',
          activeAccountName ? `Active Account: ${colors.success(activeAccountName)}` : colors.warning('No active account detected')
        ].filter(Boolean).join('\n'),
        { 
          title: "Current Repository Status", 
          type: activeAccountName ? "success" : "warning" 
        }
      );
    }
  }
  
  // Display all accounts with enhanced styling
  cfg.accounts.forEach((account, index) => {
    const isActive = account.name === activeAccountName;
    const statusIcon = isActive ? colors.success("●") : colors.muted("○");
    const statusText = isActive ? colors.success(" (ACTIVE)") : "";
    
    console.log();
    console.log(`${statusIcon} ${colors.primary(`Account ${index + 1}:`)} ${colors.text(account.name)}${statusText}`);
    
    // Git Identity
    if (account.gitUserName || account.gitEmail) {
      console.log(colors.muted("  Git Identity:"));
      if (account.gitUserName) console.log(colors.muted(`    Name: ${account.gitUserName}`));
      if (account.gitEmail) console.log(colors.muted(`    Email: ${account.gitEmail}`));
    }
    
    // SSH Configuration
    if (account.ssh) {
      console.log(colors.accent("  SSH Configuration:"));
      console.log(colors.muted(`    Key Path: ${account.ssh.keyPath}`));
      console.log(colors.muted(`    Host Alias: ${account.ssh.hostAlias || `github-${account.name}`}`));
      
      // Check if SSH key exists
      const keyExists = fs.existsSync(expandHome(account.ssh.keyPath));
      const keyStatus = keyExists ? colors.success("✓ Key exists") : colors.error("✗ Key missing");
      console.log(colors.muted(`    Status: ${keyStatus}`));
    }
    
    // Token Configuration  
    if (account.token) {
      console.log(colors.secondary("  Token Authentication:"));
      console.log(colors.muted(`    Username: ${account.token.username}`));
      console.log(colors.muted(`    Token: ${"*".repeat(20)} (stored)`));
    }
    
    // Show available methods
    const methods = [];
    if (account.ssh) methods.push(colors.accent("SSH"));
    if (account.token) methods.push(colors.secondary("Token"));
    
    if (methods.length > 0) {
      console.log(colors.muted(`    Methods: ${methods.join(", ")}`));
    }
  });
  
  console.log();
  showInfo(`Total accounts: ${cfg.accounts.length}`);
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
      const { gen } = await prompts({ 
        type: "confirm", 
        name: "gen", 
        message: stylePrompt(`SSH key not found at ${keyPath}. Generate now?`, "confirm") 
      });
      if (gen) {
        const spinner = createSpinner("Generating SSH key...");
        spinner.start();
        
        try {
          await generateSshKey(keyPath, acc.gitEmail || acc.gitUserName || `${acc.name}@github`);
          spinner.stop();
          showSuccess(`Generated SSH key: ${keyPath}`);
        } catch (error) {
          spinner.stop();
          throw error;
        }
      } else {
        showWarning("Operation cancelled.");
        return;
      }
    }
    // Ensure permissions and use Host github.com (no alias) for simpler usage
    ensureKeyPermissions(keyPath);
    ensureSshConfigBlock("github.com", keyPath);
    const newUrl = `git@github.com:${repoPath}`;
    await setRemoteUrl(newUrl, "origin", cwd);
    await setLocalGitIdentity(acc.gitUserName, acc.gitEmail, cwd);
    
    showBox(
      `Repository switched to SSH authentication\n\nRemote: ${newUrl}\nAccount: ${acc.name}`,
      { title: "SSH Configuration Applied", type: "success" }
    );
    return;
  }

  if (chosen === "token" && acc.token) {
    const httpsUrl = `https://github.com/${repoPath}`;
    await setRemoteUrl(httpsUrl, "origin", cwd);
    await setLocalGitIdentity(acc.gitUserName, acc.gitEmail, cwd);
    await ensureCredentialStore(acc.token.username, acc.token.token);
    
    showBox(
      `Repository switched to HTTPS token authentication\n\nRemote: ${httpsUrl}\nAccount: ${acc.name}\n\nNote: Token stored in ~/.git-credentials (plaintext)\nConsider using SSH for stronger local security.`,
      { title: "Token Configuration Applied", type: "success" }
    );
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
  showSuccess(`Updated account: ${acc.name}`);
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
    showSuccess("Set as default Host github.com");
  }
  if (ans.writeAlias && ans.alias) {
    ensureSshConfigBlock(acc.ssh.hostAlias!, acc.ssh.keyPath);
    showSuccess(`Alias Host added: ${acc.ssh.hostAlias}`);
  }
  saveConfig(cfg);
  showSuccess(`Imported SSH key: ${imported}`);
  showInfo(`Public key: ${pub}`);

  if (ans.test) {
    const host = ans.makeDefault ? "github.com" : (ans.writeAlias && ans.alias ? ans.alias : (acc.ssh.hostAlias || "github.com"));
    const spinner = createSpinner(`Testing SSH connection to ${host}...`);
    spinner.start();
    
    try {
      const res = await testSshConnection(host);
      spinner.stop();
      
      if (res.ok) {
        showSuccess(`SSH test OK (${host})`);
      } else {
        showError(`SSH test FAILED (${host})`);
      }
      
      if (res.message) {
        console.log(colors.muted(res.message));
      }
    } catch (error) {
      spinner.stop();
      showError("SSH test failed with error");
    }
  }
}

export async function testConnectionFlow(cfg: AppConfig) {
  if (!cfg.accounts.length) {
    showWarning("No accounts configured. Please add an account first.");
    return;
  }
  
  showSection("Test Connection");
  
  const acc = await chooseAccount(cfg.accounts);
  if (!acc) return;
  
  const methods = [
    ...(acc.ssh ? [{ title: `${colors.accent("🔑")} SSH`, value: "ssh" as const }] : []),
    ...(acc.token ? [{ title: `${colors.secondary("🔐")} Token`, value: "token" as const }] : []),
  ];
  
  if (!methods.length) {
    showError("Selected account has no authentication methods configured.");
    return;
  }
  
  const { method } = await prompts({ 
    type: methods.length === 1 ? null : "select", 
    name: "method", 
    message: stylePrompt("Test which authentication method?"), 
    choices: methods 
  });
  
  const chosen = (methods.length === 1 ? methods[0]?.value : method) as "ssh" | "token";

  if (chosen === "ssh" && acc.ssh) {
    const spinner = createSpinner("Testing SSH connection...");
    spinner.start();
    
    try {
      const res = await testSshConnection(acc.ssh.hostAlias!);
      spinner.stop();
      
      if (res.ok) {
        showSuccess("SSH connection test passed!");
      } else {
        showError("SSH connection test failed!");
      }
      
      if (res.message) {
        console.log(colors.muted(res.message));
      }
    } catch (error) {
      spinner.stop();
      showError("SSH test failed with error");
    }
  } else if (chosen === "token" && acc.token) {
    const spinner = createSpinner("Testing token authentication...");
    spinner.start();
    
    try {
      const res = await testTokenAuth(acc.token.username, acc.token.token);
      spinner.stop();
      
      if (res.ok) {
        showSuccess("Token authentication test passed!");
      } else {
        showError("Token authentication test failed!");
      }
      
      if (res.message) {
        console.log(colors.muted(res.message));
      }
    } catch (error) {
      spinner.stop();
      showError("Token test failed with error");
    }
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
  showSuccess(`Updated ~/.ssh/config → Host github.com using: ${keyPath}`);

  const { doTest } = await prompts({ 
    type: "confirm", 
    name: "doTest", 
    message: stylePrompt("Test SSH connection now?", "confirm"), 
    initial: true 
  });
  
  if (doTest) {
    const spinner = createSpinner("Testing SSH connection to github.com...");
    spinner.start();
    
    try {
      const res = await testSshConnection("github.com");
      spinner.stop();
      
      if (res.ok) {
        showSuccess("SSH test OK");
      } else {
        showError("SSH test FAILED");
      }
      
      if (res.message) {
        console.log(colors.muted(res.message));
      }
    } catch (error) {
      spinner.stop();
      showError("SSH test failed with error");
    }
  }
}
