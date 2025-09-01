# 🚀 GitHub Actions & Release Workflow

This document explains how to use the automated GitHub Actions workflows for building and releasing GhSwitch.

## 📋 Available Workflows

### 1. 🔨 Build Workflow (`.github/workflows/build.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` branch  
- Manual trigger via GitHub Actions tab

**What it does:**
- Builds Linux x64 binary for basic testing
- Runs tests (when available)
- Uploads build artifacts
- For manual triggers: builds all platform binaries

**Usage:**
```bash
# Automatically runs on push/PR
git push origin main

# Manual trigger for all platforms:
# Go to GitHub → Actions → Build → Run workflow
```

### 2. 📦 Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Git tags starting with `v*` (e.g., `v1.0.0`)
- Manual trigger with version input

**What it does:**
- Builds standalone binaries for all platforms
- Generates checksums
- Creates GitHub release with binaries
- Uploads all assets automatically

**Usage:**
```bash
# Method 1: Create and push tag
git tag v1.0.0
git push origin v1.0.0

# Method 2: Manual trigger
# Go to GitHub → Actions → Build and Release → Run workflow
# Enter version: 1.0.0
```

### 3. 📝 Release Draft Workflow (`.github/workflows/release-draft.yml`)

**Triggers:**
- Manual trigger only

**What it does:**
- Creates git tag automatically
- Builds all platform binaries
- Creates release as **DRAFT**
- Allows review before publishing

**Usage:**
```bash
# Go to GitHub → Actions → Create Release Draft → Run workflow
# Enter version: 1.0.0
# Choose if pre-release: false/true
```

## 🎯 Release Process Options

### Option 1: Automated Release (Recommended)

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: new feature description"
   git push origin main
   ```

2. **Create and push tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. **Automatic process:**
   - GitHub Actions automatically detects the tag
   - Builds all platform binaries
   - Creates release with binaries
   - Ready for distribution!

### Option 2: Manual Workflow Trigger

1. **Go to GitHub Actions:**
   - Visit: `https://github.com/podsni/GhSwitch/actions`
   - Click "Build and Release" workflow
   - Click "Run workflow"

2. **Enter details:**
   - Version: `1.0.0` (without 'v' prefix)
   - Click "Run workflow"

3. **Automatic process:**
   - Creates git tag
   - Builds binaries
   - Creates release

### Option 3: Draft Release (For Review)

1. **Go to GitHub Actions:**
   - Visit: `https://github.com/podsni/GhSwitch/actions`
   - Click "Create Release Draft" workflow
   - Click "Run workflow"

2. **Enter details:**
   - Version: `1.0.0`
   - Pre-release: check if beta/rc
   - Click "Run workflow"

3. **Review and publish:**
   - Review the draft release
   - Edit changelog if needed
   - Click "Publish release"

### Option 4: Local Release Script

1. **Run local script:**
   ```bash
   # Normal release
   ./release.sh 1.0.0
   
   # Pre-release
   ./release.sh 1.1.0-beta --prerelease
   
   # Draft release
   ./release.sh 2.0.0 --draft
   ```

2. **Requirements:**
   - GitHub CLI (`gh`) installed
   - Authenticated with GitHub

## 📁 Release Assets

Every release includes:

| File | Description | Size |
|------|-------------|------|
| `ghswitch` | Linux x64 binary | ~100MB |
| `ghswitch-linux-arm64` | Linux ARM64 binary | ~93MB |
| `ghswitch.exe` | Windows x64 binary | ~114MB |
| `ghswitch-macos` | macOS Intel binary | ~64MB |
| `ghswitch-macos-arm64` | macOS Apple Silicon binary | ~58MB |
| `checksums.txt` | SHA256 checksums | <1KB |

## 🔐 Verification Process

All binaries include:
- **Minification** for smaller size
- **Source maps** for debugging
- **SHA256 checksums** for integrity verification
- **Cross-compilation** from Linux CI

## 🏷️ Version Naming

Follow semantic versioning:
- `v1.0.0` - Major release
- `v1.1.0` - Minor release (new features)
- `v1.0.1` - Patch release (bug fixes)
- `v1.1.0-beta` - Pre-release
- `v2.0.0-rc.1` - Release candidate

## 🔧 Troubleshooting

### Build Fails
- Check Bun version compatibility
- Verify all dependencies are installed
- Check TypeScript compilation errors

### Release Creation Fails
- Verify GitHub token permissions
- Check if tag already exists
- Ensure repository has proper access

### Missing Binaries
- Check if build completed successfully
- Verify all platforms built without errors
- Check GitHub Actions logs

## 📞 Manual Override

If automated releases fail, you can always:

1. **Build locally:**
   ```bash
   ./build.sh
   ```

2. **Create release manually:**
   - Go to GitHub Releases
   - Click "Create a new release"
   - Upload binaries manually

## 🚀 Quick Commands

```bash
# Check workflow status
gh run list

# View latest run
gh run view

# Trigger manual build
gh workflow run build.yml

# Create release (local)
./release.sh 1.0.0

# Build all platforms (local)
./build.sh
```

This automated workflow ensures consistent, reliable releases with minimal manual intervention! 🎉
