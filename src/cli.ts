import prompts from "prompts";
import { loadConfig } from "./config";
import { addAccountFlow, listAccounts, removeAccountFlow, switchForCurrentRepo, chooseAccount } from "./flows";
import { bold } from "kleur/colors";
import { generateSshKey } from "./ssh";

export async function main() {
  const cfg = loadConfig();
  while (true) {
    const { action } = await prompts({
      type: "select",
      name: "action",
      message: "GitHub Switch — choose an action",
      choices: [
        { title: "Switch account for current repo", value: "switch" },
        { title: "List accounts", value: "list" },
        { title: "Add account", value: "add" },
        { title: "Edit account", value: "edit" },
        { title: "Remove account", value: "remove" },
        { title: "Generate SSH key for an account", value: "genkey" },
        { title: "Import SSH private key", value: "importkey" },
        { title: "Switch SSH globally (Host github.com)", value: "globalssh" },
        { title: "Test connection", value: "test" },
        { title: "Exit", value: "exit" },
      ],
      initial: 0,
    });

    if (action === "exit" || action === undefined) break;
    try {
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
          console.log("No accounts. Add one first.");
        } else {
          const acc = await chooseAccount(cfg.accounts);
          if (acc?.ssh) {
            const keyPath = acc.ssh.keyPath;
            await generateSshKey(keyPath, acc.gitEmail || acc.gitUserName || `${acc.name}@github`);
            console.log(bold("Generated SSH key:"), keyPath);
          } else {
            console.log("Selected account has no SSH configured.");
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
      console.error("Error:", e?.message || String(e));
    }
  }
}
