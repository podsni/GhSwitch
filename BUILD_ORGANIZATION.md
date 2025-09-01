# 📁 Build Organization Update

## ✅ Build Directory Structure

Build system telah diperbarui untuk menggunakan struktur yang lebih rapi:

```
GhSwitch/
├── build/                          # 📁 Build artifacts directory
│   ├── .gitkeep                   # Keeps directory in git
│   ├── ghswitch                   # Linux x64 binary
│   ├── ghswitch-linux-arm64       # Linux ARM64 binary
│   ├── ghswitch.exe               # Windows x64 binary
│   ├── ghswitch-macos             # macOS Intel binary
│   └── ghswitch-macos-arm64       # macOS Apple Silicon binary
├── checksums.txt                   # SHA256 checksums (root level)
├── build.sh                       # Build script for all platforms
├── release.sh                     # Release script with GitHub CLI
└── ...
```

## 🎯 Benefits

- ✅ **Organized**: All build artifacts in dedicated `build/` folder
- ✅ **Clean Root**: Root directory stays clean
- ✅ **Git Friendly**: `.gitkeep` maintains directory structure
- ✅ **CI/CD Ready**: GitHub Actions workflows updated
- ✅ **Consistent**: All scripts use same structure

## 🛠️ Updated Commands

### NPM Scripts
```bash
# Build for current platform
bun run build                    # → build/ghswitch

# Build for specific platforms  
bun run build:linux            # → build/ghswitch
bun run build:linux-arm        # → build/ghswitch-linux-arm64
bun run build:windows          # → build/ghswitch.exe
bun run build:macos            # → build/ghswitch-macos
bun run build:macos-arm        # → build/ghswitch-macos-arm64

# Build all platforms
bun run build:all              # → All binaries in build/

# Clean build artifacts
bun run clean                  # Removes build/* but keeps .gitkeep
```

### Direct Scripts
```bash
# Build all platforms
./build.sh                     # → All in build/ + checksums.txt

# Create release
./release.sh 1.0.0             # Uses build/ binaries

# Test binary
./build/ghswitch               # Run from build directory
```

## 📦 Release Process

All release processes updated to use `build/` structure:

### GitHub Actions
- ✅ `build.yml` - Uses `build/` for artifacts
- ✅ `release.yml` - Uploads from `build/` directory  
- ✅ `release-draft.yml` - Sources from `build/`

### Local Release
```bash
# The release script automatically:
1. Creates build/ directory
2. Builds all platform binaries → build/
3. Generates checksums.txt in root
4. Uploads build/* to GitHub Releases
```

## 🔧 Usage Examples

```bash
# Quick build and test
bun run build
./build/ghswitch

# Build all platforms for distribution
./build.sh
ls build/                      # See all binaries

# Create GitHub release
./release.sh 1.0.0

# Clean and rebuild
bun run clean
bun run build:all
```

## 📋 File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| **Binaries** | `build/` | All standalone executables |
| **Checksums** | `checksums.txt` | SHA256 verification (root) |
| **Build Script** | `build.sh` | Cross-platform build automation |
| **Release Script** | `release.sh` | GitHub release automation |
| **Git Keep** | `build/.gitkeep` | Maintains directory in git |

## 🎉 Ready for Distribution

Struktur baru ini memberikan:
- ✅ **Professional organization** 
- ✅ **Clean development environment**
- ✅ **Consistent CI/CD pipeline**
- ✅ **Easy artifact management**
- ✅ **Better .gitignore patterns**

Semua sistem build, release, dan GitHub Actions telah diperbarui untuk menggunakan struktur `build/` directory! 🚀
