#!/bin/bash

# GhSwitch Release Script
# Creates a new release with standalone binaries

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Show help
show_help() {
    echo -e "${PURPLE}"
    echo "  ██████╗ ██╗  ██╗███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗"
    echo "  ██╔════╝ ██║  ██║██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║"
    echo "  ██║  ███╗███████║███████╗██║ █╗ ██║██║   ██║   ██║     ███████║"
    echo "  ██║   ██║██╔══██║╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║"
    echo "  ╚██████╔╝██║  ██║███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║"
    echo "  ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝"
    echo ""
    echo -e "${CYAN}GhSwitch Release Script${NC}"
    echo ""
    echo "Usage: $0 [VERSION] [OPTIONS]"
    echo ""
    echo "Arguments:"
    echo "  VERSION           Release version (e.g., 1.0.0 - without 'v' prefix)"
    echo ""
    echo "Options:"
    echo "  -p, --prerelease  Mark as pre-release"
    echo "  -d, --draft       Create as draft release"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 1.0.0                    # Create v1.0.0 release"
    echo "  $0 1.1.0 --prerelease       # Create v1.1.0 pre-release"
    echo "  $0 2.0.0 --draft            # Create v2.0.0 draft release"
    echo ""
    echo "This script will:"
    echo "  1. Validate version format"
    echo "  2. Build standalone binaries for all platforms"
    echo "  3. Generate checksums"
    echo "  4. Create GitHub release with binaries"
}

# Validate version format
validate_version() {
    local version="$1"
    if [[ ! $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format: $version"
        print_status "Version should be in format: x.y.z (e.g., 1.0.0)"
        exit 1
    fi
}

# Check if git is clean
check_git_status() {
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes!"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Aborting release"
            exit 1
        fi
    fi
}

# Build all binaries
build_binaries() {
    local version="$1"
    
    print_status "Building GhSwitch v$version for all platforms..."
    echo ""
    
    # Create build directory
    print_status "Creating build directory..."
    mkdir -p build
    
    # Clean up previous builds
    print_status "Cleaning up previous builds..."
    rm -f build/* checksums.txt
    
    # Build for Linux x64
    print_status "🐧 Building for Linux x64..."
    bun build --compile --target=bun-linux-x64 --minify --sourcemap --outfile build/ghswitch ./index.ts
    print_success "Linux x64 build complete"
    
    # Build for Linux ARM64
    print_status "🐧 Building for Linux ARM64..."
    bun build --compile --target=bun-linux-arm64 --minify --sourcemap --outfile build/ghswitch-linux-arm64 ./index.ts
    print_success "Linux ARM64 build complete"
    
    # Build for Windows x64
    print_status "🪟 Building for Windows x64..."
    bun build --compile --target=bun-windows-x64 --minify --sourcemap --outfile build/ghswitch.exe ./index.ts
    print_success "Windows x64 build complete"
    
    # Build for macOS x64
    print_status "🍎 Building for macOS x64..."
    bun build --compile --target=bun-darwin-x64 --minify --sourcemap --outfile build/ghswitch-macos ./index.ts
    print_success "macOS x64 build complete"
    
    # Build for macOS ARM64
    print_status "🍎 Building for macOS ARM64..."
    bun build --compile --target=bun-darwin-arm64 --minify --sourcemap --outfile build/ghswitch-macos-arm64 ./index.ts
    print_success "macOS ARM64 build complete"
    
    echo ""
    print_success "All builds completed successfully!"
    
    # Generate checksums
    print_status "Generating checksums..."
    cd build
    sha256sum * > ../checksums.txt
    cd ..
    print_success "Checksums generated"
    
    # Show file sizes
    echo ""
    print_status "Build Summary:"
    echo "────────────────────────────────────────"
    ls -lh build/* checksums.txt 2>/dev/null | awk '{printf "%-30s %8s\n", $9, $5}' || true
    echo "────────────────────────────────────────"
}

# Create GitHub release
create_release() {
    local version="$1"
    local prerelease="$2"
    local draft="$3"
    
    print_status "Creating GitHub release v$version..."
    
    # Check if gh CLI is available
    if ! command -v gh >/dev/null 2>&1; then
        print_error "GitHub CLI (gh) is required but not installed"
        print_status "Install it from: https://cli.github.com/"
        print_status "Alternatively, create the release manually on GitHub"
        return 1
    fi
    
    # Create release notes
    local release_notes="release_notes_v$version.md"
    cat > "$release_notes" << EOF
# 🎉 GhSwitch v$version

**Beautiful GitHub Account Switcher - Standalone Binaries**

## 📦 Downloads

Choose the appropriate binary for your platform:

| Platform | Binary | Size |
|----------|--------|------|
| 🐧 **Linux x64** | \`ghswitch\` | ~100MB |
| 🐧 **Linux ARM64** | \`ghswitch-linux-arm64\` | ~93MB |
| 🪟 **Windows x64** | \`ghswitch.exe\` | ~114MB |
| 🍎 **macOS Intel** | \`ghswitch-macos\` | ~64MB |
| 🍎 **macOS Apple Silicon** | \`ghswitch-macos-arm64\` | ~58MB |

## 🚀 Quick Installation

### One-line installation:
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install.sh | bash
\`\`\`

### Manual installation:
\`\`\`bash
# Download binary for your platform
wget https://github.com/podsni/GhSwitch/releases/download/v$version/ghswitch

# Make executable
chmod +x ghswitch

# Run
./ghswitch
\`\`\`

## ✨ Features

- 🎨 **Beautiful terminal interface** with colors and animations
- 🔄 **Multi-account GitHub switching** per repository
- 🔐 **Dual authentication support**: SSH keys and Personal Access Tokens
- 🎯 **Active account detection** - see which account is currently active
- 🧪 **Connection testing** - verify GitHub connectivity
- ⚡ **Zero dependencies** - single executable file
- 🖥️ **Cross-platform** - works on Linux, Windows, and macOS

## 🔧 Verification

Verify the integrity of your download using checksums:
\`\`\`bash
# Download checksums
wget https://github.com/podsni/GhSwitch/releases/download/v$version/checksums.txt

# Verify
sha256sum -c checksums.txt
\`\`\`

## 📚 Documentation

- [📖 Complete Documentation](https://github.com/podsni/GhSwitch/blob/main/README.md)
- [📦 Distribution Guide](https://github.com/podsni/GhSwitch/blob/main/DISTRIBUTION.md)

---

**Full Changelog**: https://github.com/podsni/GhSwitch/compare/v1.0.0...v$version
EOF
    
    # Build gh command
    local gh_cmd="gh release create v$version"
    
    # Add binaries from build directory
    gh_cmd="$gh_cmd build/ghswitch build/ghswitch-linux-arm64 build/ghswitch.exe build/ghswitch-macos build/ghswitch-macos-arm64 checksums.txt"
    
    # Add options
    gh_cmd="$gh_cmd --title 'GhSwitch v$version'"
    gh_cmd="$gh_cmd --notes-file '$release_notes'"
    
    if [ "$prerelease" = true ]; then
        gh_cmd="$gh_cmd --prerelease"
    fi
    
    if [ "$draft" = true ]; then
        gh_cmd="$gh_cmd --draft"
    fi
    
    # Execute command
    if eval "$gh_cmd"; then
        print_success "GitHub release created successfully!"
        echo ""
        print_status "Release URL: https://github.com/podsni/GhSwitch/releases/tag/v$version"
        
        if [ "$draft" = true ]; then
            print_warning "Release created as DRAFT - don't forget to publish it!"
        fi
    else
        print_error "Failed to create GitHub release"
        print_status "Release notes saved to: $release_notes"
        print_status "You can create the release manually using these files"
        return 1
    fi
    
    # Cleanup
    rm -f "$release_notes"
}

# Main function
main() {
    local version=""
    local prerelease=false
    local draft=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--prerelease)
                prerelease=true
                shift
                ;;
            -d|--draft)
                draft=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -*)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                if [ -z "$version" ]; then
                    version="$1"
                else
                    print_error "Multiple versions specified: $version and $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # Check if version is provided
    if [ -z "$version" ]; then
        print_error "Version not specified"
        show_help
        exit 1
    fi
    
    # Validate version format
    validate_version "$version"
    
    # Check git status
    check_git_status
    
    # Show summary
    echo -e "${PURPLE}"
    echo "🚀 Creating release for GhSwitch v$version"
    echo ""
    echo -e "${NC}Configuration:"
    echo "  Version: v$version"
    echo "  Pre-release: $prerelease"
    echo "  Draft: $draft"
    echo ""
    
    read -p "Continue with release? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Aborting release"
        exit 1
    fi
    
    # Build binaries
    build_binaries "$version"
    
    # Create release
    create_release "$version" "$prerelease" "$draft"
    
    print_success "Release process completed! 🎉"
}

# Run main function with all arguments
main "$@"
