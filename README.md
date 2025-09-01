# 🎯 GhSwitch - Beautiful GitHub Account Switcher

<## 🚀 Quick Start

**After installation, usage is simple:**

```bash
# Start interactive mode
ghswitch

# Check version
ghswitch --version

# Get help
ghswitch --help
```

This will launch the interactive menu where you can:

1. **Add your GitHub accounts** (SSH keys and/or tokens)
2. **Switch between accounts** in any repository
3. **Test connections** to verify everything works
4. **Manage account settings** as needed

### First Time Setup

1. Run `ghswitch` in your terminal
2. Choose "➕ Add account"
3. Enter your GitHub account details
4. Choose authentication method (SSH or Token)
5. Follow the prompts to configure

### Switching Accounts

1. Navigate to any Git repository
2. Run `ghswitch`
3. Choose "🔄 Switch account for current repo"
4. Select your desired account
5. Done! Your repository now uses the selected account">

[![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-black?style=for-the-badge&logo=bun)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Terminal UI](https://img.shields.io/badge/Terminal-UI-purple?style=for-the-badge&logo=terminal&logoColor=white)](https://charm.sh)

*✨ A beautiful, interactive CLI tool for seamlessly managing multiple GitHub accounts per repository*

</div>

## 📦 Installation

### 🚀 One-line Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash
```

### 📦 Package Managers

**NPM/Yarn/PNPM**
```bash
npm install -g ghswitch
yarn global add ghswitch
pnpm add -g ghswitch
```

**Bun (Recommended)**
```bash
bun install -g ghswitch
```

> 🐚 **Shell Compatibility**: Works with bash, zsh, fish, and other POSIX-compatible shells. Automatically detects and uses the best runtime (Bun → Node.js → fallback).

**Homebrew (macOS/Linux)**
```bash
brew tap podsni/ghswitch
brew install ghswitch
```

**Arch Linux (AUR)**
```bash
yay -S ghswitch-bin
paru -S ghswitch-bin
```

**Scoop (Windows)**
```powershell
scoop bucket add podsni https://github.com/podsni/scoop-ghswitch
scoop install ghswitch
```

### 📥 Manual Download

Download pre-built binaries from [GitHub Releases](https://github.com/podsni/GhSwitch/releases/latest):

- **Linux x64**: `ghswitch`
- **Linux ARM64**: `ghswitch-linux-arm64`  
- **Windows x64**: `ghswitch.exe`
- **macOS Intel**: `ghswitch-macos`
- **macOS Apple Silicon**: `ghswitch-macos-arm64`

```bash
# Make executable and move to PATH
chmod +x ghswitch
sudo mv ghswitch /usr/local/bin/
```

> 📋 See [INSTALL.md](INSTALL.md) for all installation methods and troubleshooting.

### 📥 Manual Download

Download pre-built binaries from [GitHub Releases](https://github.com/podsni/GhSwitch/releases/latest):

- **Linux x64**: `ghswitch`
- **Linux ARM64**: `ghswitch-linux-arm64`
- **Windows x64**: `ghswitch.exe`
- **macOS Intel**: `ghswitch-macos`
- **macOS Apple Silicon**: `ghswitch-macos-arm64`

```bash
# Make executable and move to PATH
chmod +x ghswitch
sudo mv ghswitch /usr/local/bin/
```

> 📋 See [INSTALL.md](INSTALL.md) for all installation methods and troubleshooting.

## 🌟 Features

- 🎨 **Beautiful Terminal UI** - Inspired by [Charm](https://charm.sh) design principles
- 🔄 **Multi-Account Support** - Effortlessly switch between different GitHub accounts
- 🔐 **Dual Authentication** - Support for both SSH keys and Personal Access Tokens
- 📁 **Per-Repository Configuration** - Different accounts for different repositories
- ⚡ **Zero Dependencies** - Single executable file, no runtime required
- 🎯 **Interactive Interface** - Intuitive prompts and visual feedback
- 🔑 **SSH Key Management** - Generate, import, and manage SSH keys
- 🌈 **Colorful Output** - Rich colors and gradients for better UX
- 🎯 **Active Account Detection** - See which account is currently active
- 🖥️ **Cross-Platform Support** - Full Windows, Linux, macOS compatibility with proper path handling
- Generate SSH key dan Import SSH private key (auto chmod, auto `.pub`, auto alias/penamaan berdasarkan username).
- Test koneksi: uji SSH alias dan/atau token.

## 🛠️ Development Setup

**Only needed if you want to build from source:**

### Prasyarat

- Bun v1.0+
- Git
- OpenSSH (`ssh`, `ssh-keygen`)
- opsional: `curl` (untuk tes token)

### Instalasi

```bash
# Clone repository
git clone https://github.com/podsni/GhSwitch.git
cd GhSwitch

# Install dependencies
bun install
```

### Development

```bash
# Run in development mode
bun run index.ts

# or
bun run start
```

### Building Standalone Executables

```bash
# Build for current platform
bun run build

# Build for all platforms
./build.sh

# Individual platform builds
bun run build:linux     # Linux x64
bun run build:windows   # Windows x64
bun run build:macos     # macOS x64 & ARM64
```

Anda akan melihat menu interaktif di terminal.

## Konsep Singkat

- Setiap “akun” menyimpan: label, `user.name`/`user.email` (opsional), konfigurasi SSH (key path + host alias), dan/atau konfigurasi Token (username + PAT).
- Konfigurasi disimpan di `~/.config/github-switch/config.json`.
- Untuk SSH, tool akan menulis blok `Host` pada `~/.ssh/config` seperti contoh:

```
Host github-<label>
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_<label>
  IdentitiesOnly yes
```

## Alur Utama

1) Tambah Akun (Add account)
- Pilih metode: SSH, Token, atau keduanya.
- Isi `user.name`/`user.email` jika ingin di-set per repo saat switch.
- SSH: pilih dari daftar key yang sudah ada di `~/.ssh` (auto-suggestion) atau ketik path manual; bisa generate baru jika belum ada.
- Token: isi username + Personal Access Token (PAT).

2) Import SSH Private Key (opsional, lebih mudah)
- Pilih menu “Import SSH private key”.
- Masukkan GitHub username → tool otomatis menyarankan nama file tujuan langsung di `~/.ssh`, contoh: `~/.ssh/id_ed25519_<username>`.
- Masukkan path private key sumber (mis. `~/.ssh/id_ed25519`).
- Auto-suggestion: Anda akan mendapat daftar key yang sudah ada di `~/.ssh` untuk dipilih, dan juga saran nama file tujuan yang umum dipakai.
- Pilih apakah ingin menjadikannya default untuk Host `github.com` (disarankan agar mudah ganti-ganti).
- Opsional: tambahkan juga alias Host khusus (mis. `github-<username>`), jika Anda tetap ingin alias.
- Tool akan:
  - Menyalin key ke `~/.ssh/<nama-file>` dan set permission `600`.
  - Membuat public key `<nama-file>.pub` bila belum ada (permission `644`).
  - Jika dipilih, menulis/menimpa blok `Host github.com` agar memakai key ini.
  - Jika dipilih, menulis blok alias tambahan.
  - Opsional langsung tes koneksi SSH (ke `github.com` atau alias yang dipilih).

3) Switch Akun untuk Repo Saat Ini
- Jalankan tool di dalam folder repo git.
- Pilih “Switch account for current repo”, pilih akun, lalu pilih metode (SSH/Token).
- Tool akan:
  - SSH: set `origin` → `git@github.com:owner/repo.git`, atur `user.name`/`user.email` lokal repo (Host tetap `github.com`).
  - Token: set `origin` → `https://github.com/owner/repo.git`, atur `credential.helper store` dan tulis `~/.git-credentials`.
  - Jika repo belum punya remote, tool akan minta input `owner/repo`.

4) Tes Koneksi
- Pilih “Test connection”, pilih akun, lalu pilih metode:
  - SSH: jalankan `ssh -T git@github.com` dan laporkan hasil.
  - Token: cek `https://api.github.com/user` dengan Basic Auth; sukses bila HTTP 200.

5) Switch SSH Secara Global (tetap Host github.com)
- Pilih “Switch SSH globally (Host github.com)”.
- Pilih akun (harus punya SSH key).
- Tool akan menulis/menimpa blok berikut pada `~/.ssh/config`:

```
Host github.com
  HostName github.com
  User git
  IdentityFile /path/ke/private_key_akun
  IdentitiesOnly yes
```

- Dampak: semua akses `git@github.com:owner/repo.git` akan memakai key tersebut (tanpa ganti-ganti alias). Cocok jika ingin satu key aktif secara global dan mudah ditukar.
- Anda bisa kapan saja menjalankan menu ini lagi untuk mengganti key global.

5) Edit/Hapus/List Akun
- Edit: ubah label, `user.name`/`user.email`, aktif/nonaktif metode, ganti key path/alias atau token.
- Remove: hapus akun dari konfigurasi (tidak menghapus blok `Host` otomatis agar aman; bisa dihapus manual bila perlu).
- List: tampilkan ringkasan akun yang tersimpan.

## Mode SSH (Detail)

- Generate Key: menu “Generate SSH key for an account”. Key dibuat dengan tipe Ed25519, tanpa passphrase (bisa Anda tambah sendiri nanti).
- Import Key: menu “Import SSH private key”.
  - Penamaan otomatis berdasarkan GitHub username untuk konsistensi.
  - Izin file di-set: private `600`, public `644`.
  - Alihkan host alias di `~/.ssh/config` untuk memaksa key tertentu saat akses GitHub.

## Mode Token (HTTPS)

- Remote di-set ke `https://github.com/owner/repo.git`.
- `credential.helper store` akan menulis token ke `~/.git-credentials` dalam plaintext.
- Catatan keamanan: pertimbangkan pakai SSH bila memungkinkan guna menghindari penyimpanan token plaintext.

## Tips & Praktik Terbaik

- Gunakan alias yang konsisten, mis. `github-work`, `github-personal`.
- Jika punya beberapa key, pastikan setiap repo diarahkan ke alias yang tepat.
- Untuk token, beri scope minimal yang diperlukan.

## 🎯 Use Cases

- **Personal & Work Accounts**: Keep your personal and work GitHub accounts separate
- **Multiple Organizations**: Switch between different organization accounts
- **Client Projects**: Use different accounts for different client repositories
- **Open Source & Private**: Different identities for public and private projects

## 🔧 Advanced Features

- **SSH Key Generation**: Generate Ed25519 keys directly from the CLI
- **SSH Key Import**: Import existing keys with automatic setup
- **Global SSH Switching**: Change SSH identity globally for all repositories
- **Connection Testing**: Verify SSH and token connectivity
- **Automatic Permissions**: Proper file permissions set automatically
- **Cross-Platform Paths**: Handles Windows, Linux, and macOS path differences

## 📚 Documentation

- [Installation Guide](INSTALL.md) - All installation methods
- [Distribution Guide](DISTRIBUTION.md) - For package maintainers
- [Build Instructions](BUILD_ORGANIZATION.md) - Building from source
- [Release Process](RELEASE_SETUP_COMPLETE.md) - For maintainers

## 🤝 Contributing

Contributions are welcome! Please check our [Contributing Guidelines](CONTRIBUTING.md) and feel free to:

- Report bugs by opening an [issue](https://github.com/podsni/GhSwitch/issues)
- Request features through [discussions](https://github.com/podsni/GhSwitch/discussions)
- Submit pull requests with improvements

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) for lightning-fast performance
- UI inspired by [Charm](https://charm.sh) design principles
- Thanks to all contributors who help make this tool better

---

<div align="center">

**Made with ❤️ by [podsni](https://github.com/podsni)**

⭐ If you find GhSwitch useful, please give it a star on GitHub!

</div>
