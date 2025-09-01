# 📦 GhSwitch Installation & Distribution Guide

Panduan lengkap instalasi GhSwitch dengan berbagai metode, seperti yang Anda minta!

## 🚀 Instalasi One-Line (Termudah)

### Curl (Semua Platform)
```bash
curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash
```

### Wget (Linux)
```bash
wget -qO- https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash
```

Script ini akan otomatis:
- Detect platform Anda (Linux x64/ARM64, macOS Intel/ARM, Windows)
- Download binary yang sesuai
- Install ke `/usr/local/bin/ghswitch` atau `~/.local/bin/ghswitch`
- Setup PATH jika diperlukan

## 📦 Package Managers

### NPM/Yarn/PNPM/Bun (Seperti `@google/gemini-cli`)

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

**Bun** (Recommended!)
```bash
bun install -g ghswitch
```

Setelah install, langsung bisa run:
```bash
ghswitch
```

### Homebrew (macOS/Linux)
```bash
# Add tap (sekali saja)
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

**Manual dengan makepkg**
```bash
git clone https://aur.archlinux.org/ghswitch-bin.git
cd ghswitch-bin
makepkg -si
```

### Scoop (Windows)
```powershell
# Add bucket (sekali saja)
scoop bucket add podsni https://github.com/podsni/scoop-ghswitch

# Install
scoop install ghswitch
```

### Chocolatey (Windows)
```powershell
choco install ghswitch
```

## 📥 Manual Download

Download dari [GitHub Releases](https://github.com/podsni/GhSwitch/releases/latest):

- **Linux x64**: `ghswitch`
- **Linux ARM64**: `ghswitch-linux-arm64`
- **Windows x64**: `ghswitch.exe`
- **macOS Intel**: `ghswitch-macos`
- **macOS Apple Silicon**: `ghswitch-macos-arm64`

### Install Manual

**Linux/macOS**:
```bash
# Download
wget https://github.com/podsni/GhSwitch/releases/latest/download/ghswitch

# Make executable
chmod +x ghswitch

# Move to PATH
sudo mv ghswitch /usr/local/bin/

# Test
ghswitch --version
```

**Windows**:
```powershell
# Download (gunakan browser atau PowerShell)
Invoke-WebRequest -Uri "https://github.com/podsni/GhSwitch/releases/latest/download/ghswitch.exe" -OutFile "ghswitch.exe"

# Move to PATH
Move-Item ghswitch.exe C:\Windows\System32\

# Test
ghswitch --version
```

## ✅ Verifikasi Instalasi

Setelah install dengan metode apapun:
```bash
# Cek versi
ghswitch --version
# atau
ghswitch -v

# Lihat bantuan
ghswitch --help
# atau
ghswitch -h

# Jalankan interaktif
ghswitch
```

Output versi akan terlihat seperti ini:
```
ghswitch v1.2.1
Beautiful GitHub Account Switcher
Interactive CLI tool for managing multiple GitHub accounts per repository

GitHub: https://github.com/podsni/GhSwitch
NPM: https://www.npmjs.com/package/ghswitch
```

## 🔄 Update

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
Jalankan lagi script instalasi - akan otomatis replace dengan versi terbaru:
```bash
curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash
```

## 🗑️ Uninstall

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

### Manual
```bash
# Remove binary
sudo rm /usr/local/bin/ghswitch
# atau
rm ~/.local/bin/ghswitch

# Remove config (opsional)
rm -rf ~/.config/github-switch/
```

## 🆘 Troubleshooting

### Command not found
```bash
# Pastikan di PATH
echo $PATH

# Untuk ~/.local/bin, tambah ke shell profile
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Permission denied
```bash
# Make executable
chmod +x ghswitch

# Atau untuk global install
sudo mv ghswitch /usr/local/bin/
```

### Network Issues
- Gunakan VPN jika GitHub diblokir
- Download manual dari GitHub Releases
- Cek koneksi internet

## 🎯 Alias Global

Setelah instalasi, Anda bisa gunakan alias `ghswitch` dari mana saja:

```bash
# Di repository manapun
cd ~/my-project
ghswitch

# Atau langsung test
ghswitch --version
```

## 🚀 Quick Start

1. **Install** dengan salah satu metode di atas
2. **Run** `ghswitch` 
3. **Add account** pertama Anda
4. **Switch** antar akun di repository manapun
5. **Done!** 🎉

## 📚 Dokumentasi Lengkap

- [README.md](README.md) - Overview dan fitur
- [INSTALL.md](INSTALL.md) - Detail instalasi semua platform
- [DISTRIBUTION.md](DISTRIBUTION.md) - Untuk maintainer package

---

**Sekarang GhSwitch bisa diinstall seperti tool populer lainnya!** 

Mirip dengan:
- `npm install -g @google/gemini-cli`
- `curl -fsSL https://opencode.ai/install | bash`
- `brew install sst/tap/opencode`
- `yay -S opencode-bin`

Tetapi untuk **GhSwitch** dengan alias `ghswitch` 🎯
