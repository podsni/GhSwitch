# GhSwitch - GitHub Account Switcher

A beautiful, interactive CLI tool for managing multiple GitHub accounts per repository.

## 📦 Standalone Binaries

GhSwitch is distributed as standalone executables that require no dependencies - not even Bun or Node.js!

### Download and Install

1. Download the appropriate binary for your platform:
   - **Linux x64**: `ghswitch`
   - **Linux ARM64**: `ghswitch-linux-arm64`
   - **Windows x64**: `ghswitch.exe`
   - **macOS Intel**: `ghswitch-macos`
   - **macOS Apple Silicon**: `ghswitch-macos-arm64`

2. Make it executable (Linux/macOS):
   ```bash
   chmod +x ghswitch
   ```

3. Run it:
   ```bash
   # Linux/macOS
   ./ghswitch
   
   # Windows
   ./ghswitch.exe
   ```

### Global Installation (Optional)

To use `ghswitch` from anywhere, move it to your PATH:

**Linux/macOS:**
```bash
# Copy to a directory in your PATH
sudo cp ghswitch /usr/local/bin/
# Now you can run: ghswitch
```

**Windows:**
```cmd
# Copy to a directory in your PATH, e.g.:
copy ghswitch.exe C:\Windows\System32\
# Now you can run: ghswitch
```

## ✨ Features

- 🔄 **Switch between multiple GitHub accounts** per repository
- 🔐 **Dual authentication support**: SSH keys and Personal Access Tokens
- 🎨 **Beautiful terminal interface** with colors and animations
- 🔍 **Active account detection** - see which account is currently active
- 🧪 **Connection testing** - verify your GitHub connectivity
- ⚡ **Zero dependencies** - single executable file
- 🖥️ **Cross-platform** - works on Linux, Windows, and macOS

## 🚀 Quick Start

1. **Run GhSwitch**:
   ```bash
   ./ghswitch
   ```

2. **Add your first account**:
   - Choose "➕ Add account"
   - Enter account details (name, git identity)
   - Choose authentication method (SSH or Token)
   - Follow the prompts

3. **Switch accounts in any repository**:
   - Navigate to your git repository
   - Run `./ghswitch`
   - Choose "🔄 Switch account for current repo"
   - Select your desired account

4. **Test your connection**:
   - Choose "🧪 Test connection"
   - Verify GitHub connectivity

## 📋 Account Management

### SSH Authentication
- Uses SSH keys for authentication
- Supports host aliases for multiple accounts
- Automatically manages `~/.ssh/config`
- Can generate new SSH keys if needed

### Token Authentication  
- Uses GitHub Personal Access Tokens
- Manages Git credential store
- Perfect for HTTPS workflows
- Secure token storage

### Dual Method Support
Each account can have BOTH SSH and token authentication configured for maximum flexibility.

## 🔧 Configuration

GhSwitch stores its configuration in:
- **Linux/macOS**: `~/.config/github-switch/config.json`
- **Windows**: `%APPDATA%\github-switch\config.json`

## 🛠️ Development

If you want to build from source:

```bash
# Clone the repository
git clone https://github.com/podsni/GhSwitch.git
cd GhSwitch

# Install Bun (if not already installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run in development mode
bun run index.ts

# Build standalone executables
chmod +x build.sh
./build.sh
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

Found a bug or have a feature request? Please open an issue on GitHub.

---

Made with ❤️ using Bun and TypeScript
