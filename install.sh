#!/bin/bash

# GhSwitch Installation Script
# Downloads and installs the latest release

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# GitHub repository
REPO="podsni/GhSwitch"
INSTALL_DIR="/usr/local/bin"

# Detect platform
detect_platform() {
    local os=$(uname -s | tr '[:upper:]' '[:lower:]')
    local arch=$(uname -m)
    
    case "$os" in
        linux*)
            case "$arch" in
                x86_64|amd64)
                    echo "ghswitch"
                    ;;
                aarch64|arm64)
                    echo "ghswitch-linux-arm64"
                    ;;
                *)
                    echo "Unsupported architecture: $arch" >&2
                    exit 1
                    ;;
            esac
            ;;
        darwin*)
            case "$arch" in
                x86_64|amd64)
                    echo "ghswitch-macos"
                    ;;
                arm64)
                    echo "ghswitch-macos-arm64"
                    ;;
                *)
                    echo "Unsupported architecture: $arch" >&2
                    exit 1
                    ;;
            esac
            ;;
        msys*|mingw*|cygwin*)
            echo "ghswitch.exe"
            ;;
        *)
            echo "Unsupported operating system: $os" >&2
            exit 1
            ;;
    esac
}

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

# Main installation function
install_ghswitch() {
    echo -e "${PURPLE}"
    echo "  ██████╗ ██╗  ██╗███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗"
    echo "  ██╔════╝ ██║  ██║██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║"
    echo "  ██║  ███╗███████║███████╗██║ █╗ ██║██║   ██║   ██║     ███████║"
    echo "  ██║   ██║██╔══██║╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║"
    echo "  ╚██████╔╝██║  ██║███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║"
    echo "  ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝"
    echo ""
    echo -e "${CYAN}Beautiful GitHub Account Switcher - Installation Script${NC}"
    echo ""
    
    # Detect platform
    print_status "Detecting platform..."
    local binary_name=$(detect_platform)
    print_success "Platform detected: $binary_name"
    
    # Get latest release info
    print_status "Fetching latest release information..."
    local api_url="https://api.github.com/repos/$REPO/releases/latest"
    local latest_release=$(curl -s "$api_url")
    local tag_name=$(echo "$latest_release" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    if [ -z "$tag_name" ]; then
        print_error "Failed to get latest release information from GitHub API"
        print_status "Trying alternative method..."
        # Fallback: try to get from GitHub releases page
        tag_name=$(curl -s "https://github.com/$REPO/releases/latest" | grep -o 'tag/v[^"]*' | head -1 | cut -d'/' -f2)
        
        if [ -z "$tag_name" ]; then
            print_error "Could not determine latest release version"
            print_status "Please check: https://github.com/$REPO/releases"
            exit 1
        fi
    fi
    
    print_success "Latest version: $tag_name"
    
    # Download binary from GitHub Releases
    local download_url="https://github.com/$REPO/releases/download/$tag_name/$binary_name"
    local temp_file="/tmp/$binary_name"
    
    print_status "Downloading $binary_name from GitHub Releases..."
    print_status "URL: $download_url"
    
    if curl -L -f -o "$temp_file" "$download_url"; then
        print_success "Download completed"
    else
        print_error "Failed to download binary from GitHub Releases"
        print_error "URL: $download_url"
        print_status "Please check if the release exists: https://github.com/$REPO/releases"
        exit 1
    fi
    
    # Make executable
    chmod +x "$temp_file"
    
    # Install binary
    if [ -w "$INSTALL_DIR" ] || [ "$(id -u)" = "0" ]; then
        print_status "Installing to $INSTALL_DIR..."
        cp "$temp_file" "$INSTALL_DIR/ghswitch"
        print_success "GhSwitch installed successfully!"
    else
        print_warning "No write permission to $INSTALL_DIR"
        print_status "Installing to ~/.local/bin..."
        mkdir -p ~/.local/bin
        cp "$temp_file" ~/.local/bin/ghswitch
        print_success "GhSwitch installed to ~/.local/bin/ghswitch"
        print_warning "Make sure ~/.local/bin is in your PATH"
        echo "  Add this to your shell profile:"
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
    
    # Cleanup
    rm -f "$temp_file"
    
    echo ""
    echo -e "${GREEN}🎉 Installation completed!${NC}"
    echo ""
    echo "Usage:"
    echo "  ghswitch          # Run from anywhere"
    echo "  ./ghswitch        # Run from current directory"
    echo ""
    echo "Get started:"
    echo "  1. Run: ghswitch"
    echo "  2. Add your GitHub accounts"
    echo "  3. Switch between accounts in your repositories"
    echo ""
    echo -e "${BLUE}For more information, visit: https://github.com/$REPO${NC}"
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v curl >/dev/null 2>&1; then
        missing_deps+=("curl")
    fi
    
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        print_status "Please install them and try again"
        exit 1
    fi
}

# Main execution
main() {
    check_dependencies
    install_ghswitch
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "GhSwitch Installation Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --version, -v Show version information"
        echo ""
        echo "This script automatically detects your platform and installs"
        echo "the appropriate GhSwitch binary."
        exit 0
        ;;
    --version|-v)
        echo "GhSwitch Installation Script v1.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
