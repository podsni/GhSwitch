import prompts from "prompts";
import { loadConfig } from "./config";
import { addAccountFlow, listAccounts, removeAccountFlow, switchForCurrentRepo, chooseAccount } from "./flows";
import { generateSshKey } from "./ssh";
import { 
  showTitle, 
  showSection, 
  stylePrompt, 
  showSuccess, 
  showError, 
  showSeparator,
  showWarning,
  colors 
} from "./utils/ui";

export async function main() {
  // Show beautiful title
  showTitle();
  
  const cfg = loadConfig();
  
  while (true) {
    showSection("Main Menu");
    
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: stylePrompt("Choose an action"),
      choices: [
        { 
          title: colors.primary("🔄 Switch account for current repo"), 
          value: "switch",
          description: "Change GitHub account for this repository"
        },
        { 
          title: colors.accent("📋 List accounts"), 
          value: "list",
          description: "View all configured accounts"
        },
        { 
          title: colors.success("➕ Add account"), 
          value: "add",
          description: "Configure a new GitHub account"
        },
        { 
          title: colors.secondary("✏️  Edit account"), 
          value: "edit",
          description: "Modify existing account settings"
        },
        { 
          title: colors.warning("🗑️  Remove account"), 
          value: "remove",
          description: "Delete an account configuration"
        },
        { 
          title: colors.accent("🔑 Generate SSH key"), 
          value: "genkey",
          description: "Create new SSH key for an account"
        },
        { 
          title: colors.secondary("📥 Import SSH private key"), 
          value: "importkey",
          description: "Import existing SSH key"
        },
        { 
          title: colors.primary("🌐 Switch SSH globally"), 
          value: "globalssh",
          description: "Change global SSH configuration"
        },
        { 
          title: colors.accent("🧪 Test connection"), 
          value: "test",
          description: "Verify account authentication"
        },
        { 
          title: colors.muted("🚪 Exit"), 
          value: "exit",
          description: "Close the application"
        },
      ],
      initial: 0,
    });

    if (action === "exit" || action === undefined) {
      showSeparator();
      showSuccess("Thank you for using GhSwitch! 👋");
      break;
    }
    
    try {
      showSeparator();
      
      if (action === "switch") await switchForCurrentRepo(cfg);
      if (action === "list") await listAccounts(cfg);
      if (action === "add") await addAccountFlow(cfg);
      if (action === "edit") {
        const { editAccountFlow } = await import("./flows");
        await editAccountFlow(cfg);
      }
      if (action === "remove") await removeAccountFlow(cfg);
      if (action === "genkey") {
        if (!cfg.accounts.length) {
          showError("No accounts found. Please add an account first.");
        } else {
          const acc = await chooseAccount(cfg.accounts);
          if (acc?.ssh) {
            const keyPath = acc.ssh.keyPath;
            await generateSshKey(keyPath, acc.gitEmail || acc.gitUserName || `${acc.name}@github`);
            showSuccess(`Generated SSH key: ${keyPath}`);
          } else {
            showWarning("Selected account has no SSH configuration.");
          }
        }
      }
      if (action === "importkey") {
        const { importSshKeyFlow } = await import("./flows");
        await importSshKeyFlow(cfg);
      }
      if (action === "test") {
        const { testConnectionFlow } = await import("./flows");
        await testConnectionFlow(cfg);
      }
      if (action === "globalssh") {
        const { switchGlobalSshFlow } = await import("./flows");
        await switchGlobalSshFlow(cfg);
      }
    } catch (e: any) {
      showError(`Operation failed: ${e?.message || String(e)}`);
    }
    
    // Add a pause before showing menu again
    console.log();
    await prompts({
      type: "text",
      name: "continue",
      message: colors.muted("Press Enter to continue..."),
      initial: ""
    });
  }
}
