#!/bin/bash

# Distribution Setup Script for GhSwitch
# Sets up repositories and manifests for various package managers

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Get version from package.json
get_version() {
    node -p "require('./package.json').version"
}

# Get SHA256 from a URL
get_sha256() {
    local url="$1"
    curl -sL "$url" | sha256sum | cut -d' ' -f1
}

# Setup Homebrew Tap
setup_homebrew() {
    print_header "🍺 Setting up Homebrew Tap"
    
    local version=$(get_version)
    local repo_url="https://github.com/podsni/homebrew-ghswitch"
    
    print_status "Version: $version"
    print_status "Creating Homebrew formula..."
    
    # Calculate SHA256 for macOS binary
    local macos_url="https://github.com/podsni/GhSwitch/releases/download/v${version}/ghswitch-macos"
    local macos_sha256=""
    
    print_warning "Manual steps required for Homebrew:"
    echo "1. Create repository: $repo_url"
    echo "2. Create Formula/ghswitch.rb with content from homebrew-formula.rb"
    echo "3. Update SHA256 hash for macOS binary"
    echo "4. Test with: brew install podsni/ghswitch/ghswitch"
    echo ""
}

# Setup AUR Package
setup_aur() {
    print_header "🐧 Setting up Arch Linux AUR Package"
    
    local version=$(get_version)
    
    print_status "Version: $version"
    print_status "Creating AUR PKGBUILD..."
    
    print_warning "Manual steps required for AUR:"
    echo "1. Create AUR account and SSH key"
    echo "2. git clone ssh://aur@aur.archlinux.org/ghswitch-bin.git"
    echo "3. Copy PKGBUILD to the cloned directory"
    echo "4. Update SHA256 hashes for x86_64 and aarch64 binaries"
    echo "5. makepkg --printsrcinfo > .SRCINFO"
    echo "6. git add PKGBUILD .SRCINFO && git commit -m 'Update to v$version'"
    echo "7. git push origin master"
    echo ""
}

# Setup Scoop Bucket
setup_scoop() {
    print_header "🪣 Setting up Scoop Bucket"
    
    local version=$(get_version)
    local bucket_url="https://github.com/podsni/scoop-ghswitch"
    
    print_status "Version: $version"
    print_status "Creating Scoop manifest..."
    
    print_warning "Manual steps required for Scoop:"
    echo "1. Create repository: $bucket_url"
    echo "2. Create ghswitch.json with content from scoop-manifest.json"
    echo "3. Update SHA256 hash for Windows binary"
    echo "4. Test with:"
    echo "   scoop bucket add podsni $bucket_url"
    echo "   scoop install ghswitch"
    echo ""
}

# Setup NPM Package
setup_npm() {
    print_header "📦 Setting up NPM Package"
    
    local version=$(get_version)
    
    print_status "Version: $version"
    print_status "Package name: ghswitch"
    
    if npm whoami >/dev/null 2>&1; then
        print_success "Logged into npm as: $(npm whoami)"
        print_status "Ready to publish with: ./publish-npm.sh"
    else
        print_warning "Not logged into npm. Run: npm login"
    fi
    echo ""
}

# Setup Chocolatey Package
setup_chocolatey() {
    print_header "🍫 Setting up Chocolatey Package"
    
    local version=$(get_version)
    
    print_status "Version: $version"
    
    print_warning "Manual steps required for Chocolatey:"
    echo "1. Create chocolatey package structure"
    echo "2. Create .nuspec file with metadata"
    echo "3. Create chocolateyinstall.ps1 script"
    echo "4. Test locally: choco pack && choco install ghswitch -s ."
    echo "5. Submit to community repository"
    echo ""
}

# Generate distribution checklist
generate_checklist() {
    print_header "📋 Distribution Checklist"
    
    local version=$(get_version)
    
    echo "Pre-release checklist for v$version:"
    echo ""
    echo "□ Update version in package.json"
    echo "□ Update CHANGELOG.md"
    echo "□ Build all platform binaries: ./build.sh"
    echo "□ Create GitHub release with binaries"
    echo "□ Test installation scripts"
    echo ""
    echo "Package Manager Setup:"
    echo "□ NPM: ./publish-npm.sh"
    echo "□ Homebrew: Update Formula/ghswitch.rb"
    echo "□ AUR: Update PKGBUILD and push to AUR"
    echo "□ Scoop: Update ghswitch.json manifest"
    echo "□ Chocolatey: Create and submit package"
    echo ""
    echo "Post-release:"
    echo "□ Test all installation methods"
    echo "□ Update documentation"
    echo "□ Announce on social media"
    echo ""
}

# Main menu
main() {
    echo -e "${PURPLE}"
    echo "  ██████╗ ██╗  ██╗███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗"
    echo "  ██╔════╝ ██║  ██║██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║"
    echo "  ██║  ███╗███████║███████╗██║ █╗ ██║██║   ██║   ██║     ███████║"
    echo "  ██║   ██║██╔══██║╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║"
    echo "  ╚██████╔╝██║  ██║███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║"
    echo "  ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝"
    echo ""
    echo -e "${BLUE}Distribution Setup Script${NC}"
    echo ""
    
    case "${1:-all}" in
        "homebrew")
            setup_homebrew
            ;;
        "aur")
            setup_aur
            ;;
        "scoop")
            setup_scoop
            ;;
        "npm")
            setup_npm
            ;;
        "chocolatey")
            setup_chocolatey
            ;;
        "checklist")
            generate_checklist
            ;;
        "all"|*)
            setup_npm
            setup_homebrew
            setup_aur
            setup_scoop
            setup_chocolatey
            generate_checklist
            ;;
    esac
}

# Handle arguments
case "${1:-}" in
    "--help"|"-h")
        echo "GhSwitch Distribution Setup Script"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  homebrew   Setup Homebrew tap"
        echo "  aur        Setup Arch Linux AUR package"
        echo "  scoop      Setup Scoop bucket"
        echo "  npm        Setup NPM package"
        echo "  chocolatey Setup Chocolatey package"
        echo "  checklist  Generate distribution checklist"
        echo "  all        Setup all package managers (default)"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
