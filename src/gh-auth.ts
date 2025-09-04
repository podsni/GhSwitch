import prompts from "prompts";
import { exec, run } from "./utils/shell";
import { createSpinner, showError, showInfo, showSuccess, showWarning, stylePrompt, colors } from "./utils/ui";
import { ensurePublicKey, listSshPrivateKeys } from "./ssh";
import { ensureGhInstalled } from "./gh-install";

export async function ghAuthStatus(host = "github.com"): Promise<{ ok: boolean; message: string }> {
  const res = await exec(["gh", "auth", "status", "--hostname", host]);
  const out = (res.stdout + "\n" + res.stderr).trim();
  return { ok: res.code === 0, message: out };
}

export async function ghAuthLoginWeb(host = "github.com") { return run(["gh", "auth", "login", "--hostname", host, "--web"]); }
export async function ghAuthLoginDevice(host = "github.com") { return run(["gh", "auth", "login", "--hostname", host]); }
export async function ghAuthLoginToken(token: string, host = "github.com") { return run(["bash", "-lc", `printf %s ${JSON.stringify(token)} | gh auth login --hostname ${host} --with-token`]); }
export async function ghAuthLogout(host = "github.com") { return run(["gh", "auth", "logout", "--hostname", host, "-y"]); }
export async function ghAddSshKey(pubKeyPath: string, title?: string) { const args = ["gh", "ssh-key", "add", pubKeyPath]; if (title) args.push("--title", title); return run(args); }

export async function ghGetActiveUser(): Promise<{ login?: string; name?: string } | null> {
  const res = await exec(["gh", "api", "/user"]);
  if (res.code !== 0) return null;
  try {
    const obj = JSON.parse(res.stdout || "{}");
    return { login: obj?.login, name: obj?.name };
  } catch {
    return null;
  }
}

export async function ghAuthFlow() {
  const installed = await ensureGhInstalled(true);
  if (!installed) return;
  while (true) {
    // Show active GH user (if authenticated)
    try {
      const u = await ghGetActiveUser();
      if (u?.login) console.log(colors.muted(`Active GitHub user: ${colors.accent(u.login)}${u.name? ' ('+u.name+')':''}`));
    } catch {}
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: stylePrompt("GitHub CLI Auth"),
      choices: [
        { title: "Status", value: "status" },
        { title: "Login (device code)", value: "login_device" },
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
      const spinner = createSpinner("Checking auth status..."); spinner.start();
      const r = await ghAuthStatus(host || "github.com"); spinner.stop();
      if (r.ok) showSuccess("Authenticated with gh"); else showWarning("Not authenticated");
      console.log(colors.muted(r.message));
      continue;
    }

    if (action === "login_device") {
      const { host } = await prompts({ type: "text", name: "host", message: "Hostname", initial: "github.com" });
      try { await ghAuthLoginDevice(host || "github.com"); showSuccess("Follow the device flow URL/code shown above."); }
      catch (e: any) { showError(e?.message || String(e)); }
      continue;
    }

    if (action === "login_web") {
      const { host } = await prompts({ type: "text", name: "host", message: "Hostname", initial: "github.com" });
      try { await ghAuthLoginWeb(host || "github.com"); showSuccess("Login flow started in your browser"); }
      catch (e: any) {
        showWarning("Browser open failed. Falling back to device login.");
        try { await ghAuthLoginDevice(host || "github.com"); showInfo("Follow the device flow URL/code shown above."); } 
        catch (ee:any) { showError(ee?.message || String(ee)); }
      }
      continue;
    }

    if (action === "login_token") {
      const ans = await prompts([{ type: "text", name: "host", message: "Hostname", initial: "github.com" },{ type: "password", name: "token", message: "Paste GitHub token" }]);
      if (!ans?.token) continue;
      const spinner = createSpinner("Logging in with token..."); spinner.start();
      try { await ghAuthLoginToken(ans.token, ans.host || "github.com"); spinner.stop(); showSuccess("Token login completed"); }
      catch (e: any) { spinner.stop(); showError(e?.message || String(e)); }
      continue;
    }

    if (action === "logout") {
      const { host } = await prompts({ type: "text", name: "host", message: "Hostname", initial: "github.com" });
      const { confirm } = await prompts({ type: "confirm", name: "confirm", message: stylePrompt("Log out from gh?", "confirm"), initial: false });
      if (!confirm) continue;
      const spinner = createSpinner("Logging out..."); spinner.start();
      try { await ghAuthLogout(host || "github.com"); spinner.stop(); showSuccess("Logged out of gh"); }
      catch (e: any) { spinner.stop(); showError(e?.message || String(e)); }
      continue;
    }

    if (action === "key_add") {
      const keys = listSshPrivateKeys();
      const choices = [...keys.map((k) => ({ title: k, value: k })), { title: "Enter path manually", value: "__manual__" }];
      const { sel } = await prompts({ type: choices.length ? "autocomplete" : "text", name: "sel", message: "Select SSH private key", choices });
      let priv = sel;
      if (!priv || priv === "__manual__") { const { p } = await prompts({ type: "text", name: "p", message: "Private key path (e.g., ~/.ssh/id_ed25519)" }); priv = p; }
      if (!priv) continue;
      try {
        const pub = await ensurePublicKey(priv);
        const { title } = await prompts({ type: "text", name: "title", message: "Key title", initial: `GhSwitch ${new Date().toISOString().slice(0,10)}` });
        const spinner = createSpinner("Uploading SSH key to GitHub..."); spinner.start();
        await ghAddSshKey(pub, title);
        spinner.stop();
        showSuccess("SSH key uploaded to GitHub");
      } catch (e: any) {
        showError(e?.message || String(e));
      }
      continue;
    }
  }
}
