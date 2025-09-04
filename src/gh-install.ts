import prompts from "prompts";
import { exec, run } from "./utils/shell";
import { commandExists, platform } from "./utils/platform";
import { createSpinner, showError, showInfo, showSuccess, showWarning, stylePrompt } from "./utils/ui";

export async function isGhInstalled(): Promise<boolean> {
  try {
    if (commandExists("gh")) return true;
    const res = await exec(["gh", "--version"]);
    return res.code === 0;
  } catch {
    return false;
  }
}

type InstallPlan = { label: string; commands: string[][] };

function buildInstallPlan(): InstallPlan | null {
  if (platform.isMacOS) {
    if (commandExists("brew")) {
      return { label: "Homebrew (macOS)", commands: [["brew", "update"], ["brew", "install", "gh"]] };
    }
    return null;
  }
  if (platform.isWindows) {
    if (commandExists("winget")) return { label: "winget (Windows)", commands: [["winget", "install", "--id", "GitHub.cli", "-e", "--source", "winget"]] };
    if (commandExists("choco")) return { label: "chocolatey (Windows)", commands: [["choco", "install", "gh", "-y"]] };
    if (commandExists("scoop")) return { label: "scoop (Windows)", commands: [["scoop", "install", "gh"]] };
    return null;
  }
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
  if (commandExists("dnf")) return { label: "DNF (Fedora)", commands: [["sudo", "dnf", "config-manager", "--add-repo", "https://cli.github.com/packages/rpm/gh-cli.repo"],["sudo","dnf","install","-y","gh"]] };
  if (commandExists("zypper")) return { label: "Zypper (openSUSE)", commands: [["sudo","zypper","addrepo","https://cli.github.com/packages/rpm/gh-cli.repo","gh-cli"],["sudo","zypper","refresh"],["sudo","zypper","install","-y","gh"]] };
  if (commandExists("pacman")) return { label: "Pacman (Arch)", commands: [["sudo","pacman","-Syu","--noconfirm","github-cli"]] };
  if (commandExists("apk")) return { label: "APK (Alpine)", commands: [["sudo","apk","add","github-cli"]] };
  return null;
}

export async function ensureGhInstalled(interactive = true): Promise<boolean> {
  if (await isGhInstalled()) return true;
  if (!interactive) return false;
  showWarning("GitHub CLI (gh) is not installed.");
  const plan = buildInstallPlan();
  if (!plan) {
    showInfo("Automatic install is not available for this platform.");
    showInfo("Please install GitHub CLI manually: https://cli.github.com/");
    return false;
  }
  const { confirm } = await prompts({ type: "confirm", name: "confirm", message: stylePrompt(`Install gh via ${plan.label}?`, "confirm"), initial: true });
  if (!confirm) return false;
  const spinner = createSpinner(`Installing gh using ${plan.label}...`);
  spinner.start();
  try {
    for (const cmd of plan.commands) await run(cmd);
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

