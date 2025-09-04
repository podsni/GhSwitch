import prompts from "prompts";
import { exec, run } from "./utils/shell";
import { commandExists, platform } from "./utils/platform";
import { createSpinner, showError, showInfo, showSuccess, showWarning, stylePrompt, colors } from "./utils/ui";
import { ensurePublicKey, listSshPrivateKeys } from "./ssh";
import { getCurrentRemoteInfo } from "./git";

export async function isGhInstalled(): Promise<boolean> {
  try {
    if (commandExists("gh")) return true;
    const res = await exec(["gh", "--version"]);
    return res.code === 0;
  } catch {
    return false;
  }
 

type InstallPlan = { label: string; commands: string[][] };

function buildInstallPlan(): InstallPlan | null {
  // Prefer native package managers if present
  if (platform.isMacOS) {
    if (commandExists("brew")) {
      return {
        label: "Homebrew (macOS)",
        commands: [["brew", "update"], ["brew", "install", "gh"]],
      };
    }
    // No safe non-interactive default without Homebrew
    return null;
  }

  if (platform.isWindows) {
    if (commandExists("winget")) {
      return { label: "winget (Windows)", commands: [["winget", "install", "--id", "GitHub.cli", "-e", "--source", "winget"]] };
    }
    if (commandExists("choco")) {
      return { label: "chocolatey (Windows)", commands: [["choco", "install", "gh", "-y"]] };
    }
    if (commandExists("scoop")) {
      return { label: "scoop (Windows)", commands: [["scoop", "install", "gh"]] };
    }
    return null;
  }

  // Linux distributions
  if (commandExists("apt")) {
    return {
      label: "APT (Debian/Ubuntu)",
      commands: [
        ["bash", "-lc", "type -p curl >/dev/null || sudo apt update && sudo apt install -y curl"],
        ["bash", "-lc", "curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"],
        ["bash", "-lc", "sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg"],
        ["bash", "-lc", "echo \"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"],
        ["sudo", "apt", "update"],
        ["sudo", "apt", "install", "-y", "gh"],
      ],
    };
  }
  if (commandExists("dnf")) {
    return {
      label: "DNF (Fedora)",
      commands: [
        ["sudo", "dnf", "config-manager", "--add-repo", "https://cli.github.com/packages/rpm/gh-cli.repo"],
        ["sudo", "dnf", "install", "-y", "gh"],
      ],
    };
  }
  if (commandExists("zypper")) {
    return {
      label: "Zypper (openSUSE)",
      commands: [
        ["sudo", "zypper", "addrepo", "https://cli.github.com/packages/rpm/gh-cli.repo", "gh-cli"],
        ["sudo", "zypper", "refresh"],
        ["sudo", "zypper", "install", "-y", "gh"],
      ],
    };
  }
  if (commandExists("pacman")) {
    return { label: "Pacman (Arch)", commands: [["sudo", "pacman", "-Syu", "--noconfirm", "github-cli"]] };
  }
  if (commandExists("apk")) {
    return { label: "APK (Alpine)", commands: [["sudo", "apk", "add", "github-cli"]] };
  }

  return null;
}

export async function ensureGhInstalled(interactive = true): Promise<boolean> {
  if (await isGhInstalled()) {
    return true;
  }

  if (!interactive) return false;

  showWarning("GitHub CLI (gh) is not installed.");
  const plan = buildInstallPlan();

  if (!plan) {
    showInfo("Automatic install is not available for this platform.");
    showInfo("Please install GitHub CLI manually: https://cli.github.com/");
    return false;
  }

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: stylePrompt(`Install gh via ${plan.label}?`, "confirm"),
    initial: true,
  });

  if (!confirm) return false;

  const spinner = createSpinner(`Installing gh using ${plan.label}...`);
  spinner.start();
  try {
    for (const cmd of plan.commands) {
      await run(cmd);
    }
    spinner.stop();
    showSuccess("GitHub CLI (gh) installed.");
    return true;
  } catch (e: any) {
    spinner.stop();
    showError("Failed to install GitHub CLI automatically.");
    showInfo("You can install it manually: https://cli.github.com/");
    return false;
  }
}

export async function ghAuthStatus(host = "github.com"): Promise<{ ok: boolean; message: string }> {
  const res = await exec(["gh", "auth", "status", "--hostname", host]);
  const out = (res.stdout + "\n" + res.stderr).trim();
  return { ok: res.code === 0, message: out };
}

export async function ghAuthLoginWeb(host = "github.com") {
  return run(["gh", "auth", "login", "--hostname", host, "--web"]);
}

export async function ghAuthLoginToken(token: string, host = "github.com") {
  // Pipe token into gh
  return run(["bash", "-lc", `printf %s ${JSON.stringify(token)} | gh auth login --hostname ${host} --with-token`]);
}

export async function ghAuthLogout(host = "github.com") {
  return run(["gh", "auth", "logout", "--hostname", host, "-y"]);
}

export async function ghAddSshKey(pubKeyPath: string, title?: string) {
  const args = ["gh", "ssh-key", "add", pubKeyPath];
  if (title) args.push("--title", title);
  return run(args);
}

export async function ghAuthFlow() {
  const installed = await ensureGhInstalled(true);
  if (!installed) return;

  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: stylePrompt("GitHub CLI Auth"),
      choices: [
        { title: "Status", value: "status" },
        { title: "Login (web)", value: "login_web" },
        { title: "Login (token)", value: "login_token" },
        { title: "Logout", value: "logout" },
        { title: "Upload SSH public key", value: "key_add" },
        { title: colors.muted("Back"), value: "back" },
      ],
      initial: 0,
    });

    if (!action || action === "back") break;

    if (action === "status") {
      const { host } = await prompts({ type: "text", name: "host", message: "Hostname", initial: "github.com" });
      const spinner = createSpinner("Checking auth status...");
      spinner.start();
      const r = await ghAuthStatus(host || "github.com");
      spinner.stop();
      if (r.ok) showSuccess("Authenticated with gh"); else showWarning("Not authenticated");
      console.log(colors.muted(r.message));
    }

    if (action === "login_web") {
      const { host } = await prompts({ type: "text", name: "host", message: "Hostname", initial: "github.com" });
      try {
        await ghAuthLoginWeb(host || "github.com");
        showSuccess("Login flow started in your browser");
      } catch (e: any) {
        showError(e?.message || String(e));
      }
    }

    if (action === "login_token") {
      const ans = await prompts([
        { type: "text", name: "host", message: "Hostname", initial: "github.com" },
        { type: "password", name: "token", message: "Paste GitHub token" },
      ]);
      if (!ans?.token) continue;
      const spinner = createSpinner("Logging in with token...");
      spinner.start();
      try {
        await ghAuthLoginToken(ans.token, ans.host || "github.com");
        spinner.stop();
        showSuccess("Token login completed");
      } catch (e: any) {
        spinner.stop();
        showError(e?.message || String(e));
      }
    }

    if (action === "logout") {
      const { host } = await prompts({ type: "text", name: "host", message: "Hostname", initial: "github.com" });
      const { confirm } = await prompts({ type: "confirm", name: "confirm", message: stylePrompt("Log out from gh?", "confirm"), initial: false });
      if (!confirm) continue;
      const spinner = createSpinner("Logging out...");
      spinner.start();
      try {
        await ghAuthLogout(host || "github.com");
        spinner.stop();
        showSuccess("Logged out of gh");
      } catch (e: any) {
        spinner.stop();
        showError(e?.message || String(e));
      }
    }

    if (action === "key_add") {
      const keys = listSshPrivateKeys();
      const choices = [
        ...keys.map((k) => ({ title: k, value: k })),
        { title: "Enter path manually", value: "__manual__" },
      ];
      const { sel } = await prompts({ type: choices.length ? "autocomplete" : "text", name: "sel", message: "Select SSH private key", choices });
      let priv = sel;
      if (!priv || priv === "__manual__") {
        const { p } = await prompts({ type: "text", name: "p", message: "Private key path (e.g., ~/.ssh/id_ed25519)", });
        priv = p;
      }
      if (!priv) continue;
      try {
        const pub = await ensurePublicKey(priv);
        const { title } = await prompts({ type: "text", name: "title", message: "Key title", initial: `GhSwitch ${new Date().toISOString().slice(0,10)}` });
        const spinner = createSpinner("Uploading SSH key to GitHub...");
        spinner.start();
        await ghAddSshKey(pub, title);
        spinner.stop();
        showSuccess("SSH key uploaded to GitHub");
      } catch (e: any) {
        showError(e?.message || String(e));
      }
    }
  }
}

type Issue = { number: number; title?: string };
type PR = { number: number; title?: string; headRefName?: string };

async function getDefaultRepo(): Promise<string | null> {
  const info = await getCurrentRemoteInfo(process.cwd());
  return info?.repoPath || null;
}

async function promptRepo(initial?: string | null): Promise<string | null> {
  const ans = await prompts({
    type: "text",
    name: "repo",
    message: "owner/repo",
    initial: initial || undefined,
    validate: (v) => (!v || /.+\/.+/.test(v)) ? true : "Use owner/repo",
  });
  return ans.repo || initial || null;
}

async function listIssues(repo?: string): Promise<Issue[]> {
  const args = ["gh", "issue", "list", "--limit", "50", "--json", "number,title"]; 
  if (repo) args.push("--repo", repo);
  const res = await exec(args);
  if (res.code !== 0) return [];
  try { return JSON.parse(res.stdout || "[]"); } catch { return []; }
}

async function listPRs(repo?: string): Promise<PR[]> {
  const args = ["gh", "pr", "list", "--limit", "50", "--json", "number,title,headRefName"]; 
  if (repo) args.push("--repo", repo);
  const res = await exec(args);
  if (res.code !== 0) return [];
  try { return JSON.parse(res.stdout || "[]"); } catch { return []; }
}

export async function ghToolkitFlow() {
  const installed = await ensureGhInstalled(true);
  if (!installed) return;

  while (true) {
    const { section } = await prompts({
      type: "select",
      name: "section",
      message: stylePrompt("GitHub CLI Toolkit"),
      choices: [
        { title: "Auth", value: "auth" },
        { title: "Repositories", value: "repo" },
        { title: "Issues", value: "issue" },
        { title: "Pull Requests", value: "pr" },
        { title: "Gists", value: "gist" },
        { title: "Utilities", value: "util" },
        { title: colors.muted("Back"), value: "back" },
      ],
      initial: 0,
    });

    if (!section || section === "back") break;

    if (section === "auth") {
      await ghAuthFlow();
      continue;
    }

    if (section === "repo") {
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: stylePrompt("Repositories"),
        choices: [
          { title: "Clone", value: "clone" },
          { title: "Create", value: "create" },
          { title: "Fork", value: "fork" },
          { title: "View", value: "view" },
          { title: "Delete", value: "delete" },
          { title: colors.muted("Back"), value: "back" },
        ],
      });
      if (!action || action === "back") continue;
      if (action === "clone") {
        const repoInit = await promptRepo(await getDefaultRepo());
        if (!repoInit) continue;
        const { dir } = await prompts({ type: "text", name: "dir", message: "Destination directory (optional)" });
        const spinner = createSpinner("Cloning repo...");
        spinner.start();
        try {
          await run(["gh", "repo", "clone", repoInit, ...(dir ? [dir] : [])]);
          spinner.stop();
          showSuccess("Clone completed");
        } catch (e: any) { spinner.stop(); showError(e?.message || String(e)); }
      }
      if (action === "create") {
        const ans = await prompts([
          { type: "text", name: "name", message: "Repository name" },
          { type: "text", name: "desc", message: "Description (optional)" },
          { type: "toggle", name: "private", message: "Private?", initial: true, active: "yes", inactive: "no" },
        ]);
        if (!ans?.name) continue;
        const spinner = createSpinner("Creating repository...");
        spinner.start();
        try {
          const args = ["gh", "repo", "create", ans.name, "--confirm", ans.private ? "--private" : "--public"]; 
          if (ans.desc) args.push("--description", ans.desc);
          await run(args);
          spinner.stop();
          showSuccess("Repository created");
        } catch (e: any) { spinner.stop(); showError(e?.message || String(e)); }
      }
      if (action === "fork") {
        const repo = await promptRepo(await getDefaultRepo());
        if (!repo) continue;
        const spinner = createSpinner("Forking repository...");
        spinner.start();
        try { await run(["gh", "repo", "fork", repo, "--remote"]); spinner.stop(); showSuccess("Forked and remote added"); }
        catch (e: any) { spinner.stop(); showError(e?.message || String(e)); }
      }
      if (action === "view") {
        const repo = await promptRepo(await getDefaultRepo());
        if (!repo) continue;
        try { await run(["gh", "repo", "view", repo, "--web"]); showInfo("Opened in browser"); }
        catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "delete") {
        const repo = await promptRepo(await getDefaultRepo());
        if (!repo) continue;
        const { confirm } = await prompts({ type: "confirm", name: "confirm", message: stylePrompt(`Delete ${repo}?`, "confirm"), initial: false });
        if (!confirm) continue;
        const spinner = createSpinner("Deleting repository...");
        spinner.start();
        try { await run(["gh", "repo", "delete", repo, "--yes"]); spinner.stop(); showSuccess("Repository deleted"); }
        catch (e: any) { spinner.stop(); showError(e?.message || String(e)); }
      }
      continue;
    }

    if (section === "issue") {
      const repo = await promptRepo(await getDefaultRepo());
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: stylePrompt("Issues"),
        choices: [
          { title: "List", value: "list" },
          { title: "Create", value: "create" },
          { title: "View", value: "view" },
          { title: "Close", value: "close" },
          { title: "Reopen", value: "reopen" },
          { title: colors.muted("Back"), value: "back" },
        ],
      });
      if (!action || action === "back") continue;
      if (action === "list") {
        const spinner = createSpinner("Fetching issues..."); spinner.start();
        const issues = await listIssues(repo || undefined); spinner.stop();
        if (!issues.length) { showInfo("No issues found or not accessible."); continue; }
        issues.forEach(i => console.log(`${colors.accent(`#${i.number}`)} ${i.title || ''}`));
        continue;
      }
      const issues = await listIssues(repo || undefined);
      const choices = issues.map(i => ({ title: `#${i.number} ${i.title || ''}`, value: String(i.number) }));
      const { num } = await prompts({ type: choices.length ? "autocomplete" : "text", name: "num", message: "Issue number", choices, initial: choices[0]?.value });
      const id = num || (await prompts({ type: "text", name: "n", message: "Issue number" })).n;
      if (!id) continue;
      if (action === "view") {
        try { await run(["gh", "issue", "view", id, ...(repo ? ["--repo", repo] : []), "--web"]); showInfo("Opened in browser"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "close") {
        try { await run(["gh", "issue", "close", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("Issue closed"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "reopen") {
        try { await run(["gh", "issue", "reopen", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("Issue reopened"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "create") {
        const ans = await prompts([{ type: "text", name: "title", message: "Title" }, { type: "text", name: "body", message: "Body (optional)" }]);
        if (!ans?.title) continue;
        const args = ["gh", "issue", "create", "--title", ans.title];
        if (ans.body) args.push("--body", ans.body);
        if (repo) args.push("--repo", repo);
        try { await run(args); showSuccess("Issue created"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      continue;
    }

    if (section === "pr") {
      const repo = await promptRepo(await getDefaultRepo());
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: stylePrompt("Pull Requests"),
        choices: [
          { title: "List", value: "list" },
          { title: "Create", value: "create" },
          { title: "View", value: "view" },
          { title: "Checkout", value: "checkout" },
          { title: "Merge", value: "merge" },
          { title: "Close", value: "close" },
          { title: colors.muted("Back"), value: "back" },
        ],
      });
      if (!action || action === "back") continue;
      if (action === "list") {
        const spinner = createSpinner("Fetching PRs..."); spinner.start();
        const prs = await listPRs(repo || undefined); spinner.stop();
        if (!prs.length) { showInfo("No PRs found or not accessible."); continue; }
        prs.forEach(p => console.log(`${colors.accent(`#${p.number}`)} ${p.title || ''} ${colors.muted(p.headRefName ? '('+p.headRefName+')' : '')}`));
        continue;
      }
      const prs = await listPRs(repo || undefined);
      const choices = prs.map(p => ({ title: `#${p.number} ${p.title || ''}`, value: String(p.number) }));
      const { num } = await prompts({ type: choices.length ? "autocomplete" : "text", name: "num", message: "PR number", choices, initial: choices[0]?.value });
      const id = num || (await prompts({ type: "text", name: "n", message: "PR number" })).n;
      if (!id) continue;
      if (action === "view") {
        try { await run(["gh", "pr", "view", id, ...(repo ? ["--repo", repo] : []), "--web"]); showInfo("Opened in browser"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "checkout") {
        try { await run(["gh", "pr", "checkout", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("Checked out PR branch"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "merge") {
        const { method } = await prompts({ type: "select", name: "method", message: "Merge method", choices: [
          { title: "Create merge commit", value: "merge" },
          { title: "Squash and merge", value: "squash" },
          { title: "Rebase and merge", value: "rebase" },
        ]});
        try { await run(["gh", "pr", "merge", id, "--auto", `--${method}` , ...(repo ? ["--repo", repo] : [])]); showSuccess("Merge triggered"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "close") {
        try { await run(["gh", "pr", "close", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("PR closed"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "create") {
        const { fill } = await prompts({ type: "confirm", name: "fill", message: stylePrompt("Use --fill from commits?", "confirm"), initial: true });
        const args = ["gh", "pr", "create"];
        if (fill) args.push("--fill");
        if (repo) args.push("--repo", repo);
        try { await run(args); showSuccess("PR creation initiated"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      continue;
    }

    if (section === "gist") {
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: stylePrompt("Gists"),
        choices: [
          { title: "Create from file", value: "create" },
          { title: "List", value: "list" },
          { title: "View", value: "view" },
          { title: "Delete", value: "delete" },
          { title: colors.muted("Back"), value: "back" },
        ],
      });
      if (!action || action === "back") continue;
      if (action === "create") {
        const ans = await prompts([
          { type: "text", name: "file", message: "Path to file" },
          { type: "text", name: "desc", message: "Description (optional)" },
          { type: "toggle", name: "public", message: "Public?", initial: false, active: "yes", inactive: "no" },
        ]);
        if (!ans?.file) continue;
        const args = ["gh", "gist", "create", ans.file];
        if (ans.desc) args.push("-d", ans.desc);
        if (!ans.public) args.push("-p"); // -p means secret gist
        try { await run(args); showSuccess("Gist created"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "list") {
        try { await run(["gh", "gist", "list"]); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "view") {
        const { id } = await prompts({ type: "text", name: "id", message: "Gist ID" });
        if (!id) continue;
        try { await run(["gh", "gist", "view", id, "--web"]); showInfo("Opened in browser"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "delete") {
        const { id } = await prompts({ type: "text", name: "id", message: "Gist ID" });
        if (!id) continue;
        const { confirm } = await prompts({ type: "confirm", name: "confirm", message: stylePrompt("Delete this gist?", "confirm"), initial: false });
        if (!confirm) continue;
        try { await run(["gh", "gist", "delete", id]); showSuccess("Gist deleted"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      continue;
    }

    if (section === "util") {
      const { action } = await prompts({
        type: "select",
        name: "action",
        message: stylePrompt("Utilities"),
        choices: [
          { title: "gh help", value: "help" },
          { title: "Set alias (e.g., co)", value: "alias" },
          { title: "Completion instructions", value: "compl" },
          { title: "gh api /user", value: "api" },
          { title: colors.muted("Back"), value: "back" },
        ],
      });
      if (!action || action === "back") continue;
      if (action === "help") { try { await run(["gh", "help"]); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "alias") {
        const { name, value } = await prompts([
          { type: "text", name: "name", message: "Alias name", initial: "co" },
          { type: "text", name: "value", message: "Alias value", initial: "pr checkout" },
        ]);
        if (!name || !value) continue;
        try { await run(["gh", "alias", "set", name, value]); showSuccess("Alias set"); } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "compl") {
        console.log(colors.muted("Run one of the following to enable completion:"));
        console.log("bash: eval \"$(gh completion -s bash)\"");
        console.log("zsh:  eval \"$(gh completion -s zsh)\"");
        console.log("fish: gh completion -s fish | source");
      }
      if (action === "api") {
        const { path } = await prompts({ type: "text", name: "path", message: "API path", initial: "/user" });
        if (!path) continue;
        try { await run(["gh", "api", path]); } catch (e: any) { showError(e?.message || String(e)); }
      }
      continue;
    }
  }
}

}
