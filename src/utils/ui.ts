import chalk from "chalk";
import boxen from "boxen";
import figlet from "figlet";
import gradient from "gradient-string";
import ora from "ora";

// Color schemes inspired by Charm
export const colors = {
  primary: chalk.hex("#F25D94"),
  secondary: chalk.hex("#FF9F40"), 
  accent: chalk.hex("#00D9FF"),
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  muted: chalk.gray,
  text: chalk.white,
  dim: chalk.dim,
};

// Gradient themes
export const gradients = {
  primary: gradient(["#F25D94", "#FF9F40"]),
  accent: gradient(["#00D9FF", "#0078FF"]),
  success: gradient(["#00FF88", "#00BB66"]),
  rainbow: gradient(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"]),
};

// Cross-platform figlet font loader
function loadFigletFont(text: string, preferredFont: string = "ANSI Shadow"): string {
  const fonts = [preferredFont, "Big", "Standard", "Small"];
  
  for (const font of fonts) {
    try {
      return figlet.textSync(text, {
        font: font as any,
        horizontalLayout: "fitted",
        verticalLayout: "fitted"
      });
    } catch (error) {
      // Continue to next font
      continue;
    }
  }
  
  // Ultimate fallback - manual ASCII art for GhSwitch
  return `
 ██████╗ ██╗  ██╗███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗
██╔════╝ ██║  ██║██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║
██║  ███╗███████║███████╗██║ █╗ ██║██║   ██║   ██║     ███████║
██║   ██║██╔══██║╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║
╚██████╔╝██║  ██║███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║
 ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝`;
}

// Enhanced title with figlet and gradient
export function showTitle(text: string = "GhSwitch") {
  const figletText = loadFigletFont(text);
  console.log(gradients.primary(figletText));
  console.log(colors.muted("✨ Beautiful GitHub Account Switcher ✨\n"));
}

// Enhanced box for important messages
export function showBox(content: string, options: {
  title?: string;
  type?: "info" | "success" | "warning" | "error";
  padding?: number;
} = {}) {
  const { title, type = "info", padding = 1 } = options;
  
  let borderColor = colors.primary;
  let titleColor = colors.primary;
  
  switch (type) {
    case "success":
      borderColor = colors.success;
      titleColor = colors.success;
      break;
    case "warning": 
      borderColor = colors.warning;
      titleColor = colors.warning;
      break;
    case "error":
      borderColor = colors.error;
      titleColor = colors.error;
      break;
  }
  
  const boxContent = boxen(content, {
    title: title ? titleColor(title) : undefined,
    titleAlignment: "center",
    padding,
    margin: 1,
    borderStyle: "round",
    borderColor: type === "success" ? "green" : type === "warning" ? "yellow" : type === "error" ? "red" : "magenta",
    backgroundColor: type === "error" ? "#2D1B29" : undefined,
  });
  
  console.log(boxContent);
}

// Enhanced list display
export function showList(items: Array<{ label: string; value?: string; status?: "active" | "inactive" }>) {
  console.log(colors.primary("◆ ") + colors.text("Available Options:"));
  console.log();
  
  items.forEach((item, index) => {
    const bullet = colors.accent("●");
    const indexStr = colors.dim(`[${index + 1}]`);
    const label = colors.text(item.label);
    const value = item.value ? colors.muted(` → ${item.value}`) : "";
    const status = item.status === "active" 
      ? colors.success(" ✓") 
      : item.status === "inactive" 
      ? colors.error(" ✗") 
      : "";
    
    console.log(`  ${bullet} ${indexStr} ${label}${value}${status}`);
  });
  console.log();
}

// Enhanced account display
export function showAccount(account: any, index?: number) {
  const header = index !== undefined 
    ? colors.primary(`◆ Account ${index + 1}: `) + colors.text(account.name)
    : colors.primary("◆ ") + colors.text(account.name);
  
  console.log(header);
  
  if (account.gitUserName || account.gitEmail) {
    console.log(colors.muted("  Git Identity:"));
    if (account.gitUserName) console.log(colors.muted(`    Name: ${account.gitUserName}`));
    if (account.gitEmail) console.log(colors.muted(`    Email: ${account.gitEmail}`));
  }
  
  if (account.ssh) {
    console.log(colors.accent("  SSH Configuration:"));
    console.log(colors.muted(`    Key: ${account.ssh.keyPath}`));
    if (account.ssh.hostAlias) {
      console.log(colors.muted(`    Alias: ${account.ssh.hostAlias}`));
    }
  }
  
  if (account.token) {
    console.log(colors.secondary("  Token Authentication:"));
    console.log(colors.muted(`    Username: ${account.token.username}`));
    console.log(colors.muted(`    Token: ${"*".repeat(20)}`));
  }
  
  console.log();
}

// Enhanced spinner for operations
export function createSpinner(text: string) {
  return ora({
    text: colors.text(text),
    color: "magenta",
    spinner: "dots12",
  });
}

// Enhanced success/error messages
export function showSuccess(message: string) {
  console.log(colors.success("✓ ") + colors.text(message));
}

export function showError(message: string) {
  console.log(colors.error("✗ ") + colors.text(message));
}

export function showWarning(message: string) {
  console.log(colors.warning("⚠ ") + colors.text(message));
}

export function showInfo(message: string) {
  console.log(colors.accent("ℹ ") + colors.text(message));
}

// Enhanced section headers
export function showSection(title: string) {
  console.log();
  console.log(gradients.accent(`▶ ${title}`));
  console.log(colors.muted("─".repeat(50)));
  console.log();
}

// Enhanced prompt styling
export function stylePrompt(message: string, type: "select" | "input" | "confirm" = "select") {
  const icon = type === "select" ? "◆" : type === "input" ? "◇" : "◉";
  return colors.primary(icon + " ") + colors.text(message);
}

// Repository status display
export function showRepoStatus(repoName: string, currentAccount?: string) {
  const content = [
    colors.text(`Repository: ${colors.accent(repoName)}`),
    currentAccount 
      ? colors.text(`Current Account: ${colors.success(currentAccount)}`)
      : colors.muted("No account configured")
  ].join("\n");
  
  showBox(content, {
    title: "Repository Status",
    type: currentAccount ? "success" : "warning"
  });
}

// Enhanced separator
export function showSeparator() {
  console.log(colors.muted("─".repeat(60)));
}
