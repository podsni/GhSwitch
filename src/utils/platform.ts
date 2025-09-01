import * as os from "os";
import * as path from "path";

// Platform detection
export const platform = {
  isWindows: os.platform() === "win32",
  isLinux: os.platform() === "linux",
  isMacOS: os.platform() === "darwin",
  isUnix: os.platform() !== "win32",
  type: os.platform(),
  arch: os.arch(),
  name: os.type(),
  release: os.release()
};

// Cross-platform path handling
export function normalizePath(filepath: string): string {
  if (!filepath) return filepath;
  
  // Handle tilde expansion
  if (filepath.startsWith("~")) {
    filepath = filepath.replace(/^~/, os.homedir());
  }
  
  // Normalize path separators
  return path.normalize(filepath);
}

// Get home directory with proper handling
export function getHomeDirectory(): string {
  if (platform.isWindows) {
    // On Windows, prefer USERPROFILE over os.homedir() for consistency
    return process.env.USERPROFILE || process.env.HOME || os.homedir();
  }
  
  return os.homedir();
}

// Get SSH directory with platform-specific handling
export function getSshDirectory(): string {
  const homeDir = getHomeDirectory();
  
  if (platform.isWindows) {
    // Windows SSH directory can be in different locations
    const possibleDirs = [
      path.join(homeDir, ".ssh"),
      path.join(process.env.PROGRAMDATA || "C:\\ProgramData", "ssh"),
      path.join(process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"), "ssh")
    ];
    
    // Return the first one that exists or default to .ssh in home
    for (const dir of possibleDirs) {
      try {
        if (require("fs").existsSync(dir)) {
          return dir;
        }
      } catch {
        continue;
      }
    }
  }
  
  return path.join(homeDir, ".ssh");
}

// Get config directory with XDG support on Linux
export function getConfigDirectory(appName: string = "github-switch"): string {
  if (platform.isWindows) {
    // Windows: Use %APPDATA%
    const appData = process.env.APPDATA || path.join(getHomeDirectory(), "AppData", "Roaming");
    return path.join(appData, appName);
  }
  
  if (platform.isLinux || platform.isMacOS) {
    // Linux/macOS: Use XDG_CONFIG_HOME or ~/.config
    const configHome = process.env.XDG_CONFIG_HOME || path.join(getHomeDirectory(), ".config");
    return path.join(configHome, appName);
  }
  
  // Fallback
  return path.join(getHomeDirectory(), `.${appName}`);
}

// Expand environment variables and tilde
export function expandPath(filepath: string): string {
  if (!filepath) return filepath;
  
  // Expand environment variables
  if (platform.isWindows) {
    // Windows environment variables: %VAR%
    filepath = filepath.replace(/%([^%]+)%/g, (match, varName) => {
      return process.env[varName] || match;
    });
  } else {
    // Unix environment variables: $VAR or ${VAR}
    filepath = filepath.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      return process.env[varName] || match;
    });
    filepath = filepath.replace(/\$([A-Z_][A-Z0-9_]*)/g, (match, varName) => {
      return process.env[varName] || match;
    });
  }
  
  return normalizePath(filepath);
}

// Get Git credentials file path
export function getGitCredentialsPath(): string {
  if (platform.isWindows) {
    // Windows: typically in user profile
    return path.join(getHomeDirectory(), ".git-credentials");
  }
  
  return path.join(getHomeDirectory(), ".git-credentials");
}

// Check if a command exists in PATH
export function commandExists(command: string): boolean {
  try {
    if (platform.isWindows) {
      // On Windows, check common locations and PATH
      const { execSync } = require("child_process");
      execSync(`where ${command}`, { stdio: "ignore" });
      return true;
    } else {
      // On Unix systems
      const { execSync } = require("child_process");
      execSync(`which ${command}`, { stdio: "ignore" });
      return true;
    }
  } catch {
    return false;
  }
}

// Get shell command with proper escaping
export function getShellCommand(command: string, args: string[] = []): { command: string; args: string[] } {
  if (platform.isWindows) {
    // On Windows, some commands might need different handling
    if (command === "ssh" || command === "ssh-keygen" || command === "git") {
      // These should work directly if installed
      return { command, args };
    }
    
    // For other commands, might need cmd wrapper
    return { command: "cmd", args: ["/c", command, ...args] };
  }
  
  return { command, args };
}

// Platform-specific information
export function getPlatformInfo(): string {
  const info = [
    `Platform: ${platform.type}`,
    `Architecture: ${platform.arch}`,
    `OS: ${platform.name} ${platform.release}`,
    `Home: ${getHomeDirectory()}`,
    `SSH Dir: ${getSshDirectory()}`,
    `Config Dir: ${getConfigDirectory()}`
  ];
  
  return info.join("\n");
}

export default platform;
