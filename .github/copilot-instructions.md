# GitHub Account Switcher (GhSwitch) - AI Coding Instructions

## Project Overview
Interactive CLI tool for managing multiple GitHub accounts per repository. Supports both SSH (with host aliases + separate keys) and HTTPS Token authentication methods. Built with Bun runtime and TypeScript.

## Core Architecture

### Entry Point & Flow
- `index.ts` → `src/cli.ts` main menu → specific flows in `src/flows.ts`
- Interactive prompts using `prompts` library for all user interactions
- Configuration stored in `~/.config/github-switch/config.json`

### Key Modules & Responsibilities
- `src/types.ts`: Core data structures (`Account`, `SshConfig`, `TokenConfig`, `AppConfig`)
- `src/config.ts`: Config file loading/saving with XDG_CONFIG_HOME support
- `src/flows.ts`: All user interaction flows (add/edit/remove accounts, switching, testing)
- `src/ssh.ts`: SSH key management, `~/.ssh/config` manipulation, permission handling
- `src/git.ts`: Git operations (remotes, identity, credential store), token auth testing
- `src/utils/shell.ts`: Bun-based shell command execution with proper error handling

### Critical Design Patterns

#### SSH Configuration Strategy
- Uses `Host github.com` (not aliases) for simplicity in `switchForCurrentRepo`
- SSH config blocks written to `~/.ssh/config` with `IdentitiesOnly yes`
- Automatic permission setting: private keys `600`, public keys `644`, SSH dir `700`
- Auto-generates public keys from private keys when missing using `ssh-keygen -y`

#### Token Management
- HTTPS URLs with credential helper store in `~/.git-credentials` 
- Filters existing GitHub entries before adding new ones in `ensureCredentialStore`
- Uses Basic Auth for API testing via curl

#### Account Data Model
```typescript
// Each account can have BOTH SSH and token methods
type Account = {
  name: string;           // Short label for UI
  gitUserName?: string;   // Optional per-repo git identity
  gitEmail?: string;
  ssh?: SshConfig;        // keyPath + optional hostAlias
  token?: TokenConfig;    // username + PAT
};
```

## Development Workflows

### Running & Testing
```bash
bun install          # Install dependencies
bun run index.ts     # Start interactive CLI
bun run start        # Alternative via npm script
```

### Key File Locations
- Config: `~/.config/github-switch/config.json`
- SSH: `~/.ssh/config`, `~/.ssh/id_*` keys
- Git credentials: `~/.git-credentials`

### Shell Command Patterns
- Use `run()` for commands that should throw on failure
- Use `exec()` for commands where you need exit codes (like SSH testing)
- All commands go through Bun's `$` template literal with proper escaping
- Working directory passed via `opts.cwd` parameter

## Code Conventions

### Error Handling
- CLI flows wrap operations in try/catch, showing `e?.message || String(e)`
- Shell commands throw descriptive errors via `shell.ts` utilities
- File operations check existence before proceeding when needed

### Interactive Prompts
- Use `prompts` library with consistent patterns:
  - `type: "select"` for single choice from list
  - `type: "multiselect"` for multiple selections
  - `type: "autocomplete"` for SSH key selection with existing file suggestions
  - `type: null` to skip prompts conditionally

### File Path Handling
- `expandHome()` for `~` expansion in user input
- Absolute paths throughout the codebase
- `path.join()` for cross-platform compatibility

### SSH Key Management
- Ed25519 keys preferred (`ssh-keygen -t ed25519`)
- Automatic filename suggestions based on username: `id_ed25519_<username>`
- `ensureKeyPermissions()` called after any key operations
- Public key auto-generation from private keys when missing

## Integration Points

### Git Repository Detection
- Check `isGitRepo()` before repo-specific operations
- Parse existing remotes to extract `owner/repo` format
- Handle both SSH and HTTPS URL formats in `parseRepoFromUrl()`

### SSH Configuration Management
- Block replacement logic in `ensureSshConfigBlock()` preserves other Host entries
- Host matching is line-based, looking for exact `Host <alias>` lines
- Always appends newline to maintain proper SSH config format

### Cross-Platform Considerations
- Uses `os.homedir()` and `path.join()` throughout
- Shell command execution via Bun's cross-platform `$` template
- File permissions handled with try/catch for systems that don't support chmod

When modifying this codebase, maintain the interactive CLI patterns, preserve the dual SSH/token authentication approach, and ensure all file operations include proper permission handling.
