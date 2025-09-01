# 📦 GhSwitch Installation Methods

Multiple ways to install GhSwitch on your system:

## 🚀 One-line Install (Recommended)

**Curl (Cross-platform)**
```bash
curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash
```

**Wget (Linux)**
```bash
wget -qO- https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash
```

This will automatically detect your platform and install the appropriate binary to `/usr/local/bin` or `~/.local/bin`.

## 📦 Package Managers

### NPM/Yarn (Global Installation)

**NPM**
```bash
npm install -g ghswitch
```

**Yarn**
```bash
yarn global add ghswitch
```

**PNPM**
```bash
pnpm add -g ghswitch
```

### Bun (Recommended for Bun users)

```bash
bun install -g ghswitch
```

### Homebrew (macOS/Linux)

```bash
# Add the tap (once)
brew tap podsni/ghswitch

# Install
brew install ghswitch
```

### Arch Linux (AUR)

**Using yay**
```bash
yay -S ghswitch-bin
```

**Using paru**
```bash
paru -S ghswitch-bin
```

**Using makepkg**
```bash
git clone https://aur.archlinux.org/ghswitch-bin.git
cd ghswitch-bin
makepkg -si
```

### Scoop (Windows)

```powershell
# Add bucket (once)
scoop bucket add podsni https://github.com/podsni/scoop-ghswitch

# Install
scoop install ghswitch
```

### Chocolatey (Windows)

```powershell
choco install ghswitch
```

## 📥 Manual Download

Download pre-built binaries from [GitHub Releases](https://github.com/podsni/GhSwitch/releases/latest):

- **Linux x64**: `ghswitch`
- **Linux ARM64**: `ghswitch-linux-arm64`
- **Windows x64**: `ghswitch.exe`
- **macOS Intel**: `ghswitch-macos`
- **macOS Apple Silicon**: `ghswitch-macos-arm64`

### Manual Installation Steps

1. **Download** the appropriate binary for your platform
2. **Make executable** (Linux/macOS):
   ```bash
   chmod +x ghswitch
   ```
3. **Move to PATH** (optional, for global access):
   ```bash
   # Linux/macOS
   sudo mv ghswitch /usr/local/bin/
   
   # Or to user directory
   mkdir -p ~/.local/bin
   mv ghswitch ~/.local/bin/
   
   # Windows (as administrator)
   move ghswitch.exe C:\Windows\System32\
   ```

## 🔧 Development Installation

For contributors or advanced users who want to build from source:

```bash
# Clone repository
git clone https://github.com/podsni/GhSwitch.git
cd GhSwitch

# Install dependencies
bun install

# Run in development
bun run start

# Build standalone binary
bun run build
```

## ✅ Verify Installation

After installation, verify it works:

```bash
ghswitch --version
```

You should see the version number and be able to run:

```bash
ghswitch
```

## 🔄 Updating

### Package Managers
```bash
# NPM
npm update -g ghswitch

# Yarn
yarn global upgrade ghswitch

# Bun
bun update -g ghswitch

# Homebrew
brew upgrade ghswitch

# Arch Linux
yay -Syu ghswitch-bin

# Scoop
scoop update ghswitch

# Chocolatey
choco upgrade ghswitch
```

### One-line Installer
Simply run the one-line installer again - it will download and replace the existing binary with the latest version.

## 🗑️ Uninstalling

### Package Managers
```bash
# NPM
npm uninstall -g ghswitch

# Yarn
yarn global remove ghswitch

# Bun
bun remove -g ghswitch

# Homebrew
brew uninstall ghswitch

# Arch Linux
yay -R ghswitch-bin

# Scoop
scoop uninstall ghswitch

# Chocolatey
choco uninstall ghswitch
```

### Manual Removal
```bash
# Remove binary
sudo rm /usr/local/bin/ghswitch
# or
rm ~/.local/bin/ghswitch

# Remove configuration (optional)
rm -rf ~/.config/github-switch/
```

## 🆘 Troubleshooting

### Command not found
- Make sure the installation directory is in your `$PATH`
- For `~/.local/bin`, add to your shell profile:
  ```bash
  export PATH="$HOME/.local/bin:$PATH"
  ```

### Permission denied
- Make sure the binary is executable: `chmod +x ghswitch`
- For global installation, you may need `sudo`

### Download issues
- Check your internet connection
- Try using a VPN if GitHub is blocked
- Download manually from GitHub Releases

---

**Need help?** Open an issue on [GitHub](https://github.com/podsni/GhSwitch/issues) or check our [documentation](https://github.com/podsni/GhSwitch).
