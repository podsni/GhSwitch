#!/bin/bash

# GhSwitch - One-line Installation Script
# Usage: curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash

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
LOCAL_INSTALL_DIR="$HOME/.local/bin"

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
                    print_error "Unsupported architecture: $arch"
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
                    print_error "Unsupported architecture: $arch"
                    exit 1
                    ;;
            esac
            ;;
        msys*|mingw*|cygwin*)
            echo "ghswitch.exe"
            ;;
        *)
            print_error "Unsupported operating system: $os"
            exit 1
            ;;
    esac
}

# Check if running in CI/automated environment
is_automated() {
    [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ] || [ ! -t 0 ]
}

# Installation banner
show_banner() {
    echo -e "${PURPLE}"
    echo "  ██████╗ ██╗  ██╗███████╗██╗    ██╗██╗████████╗ ██████╗██╗  ██╗"
    echo "  ██╔════╝ ██║  ██║██╔════╝██║    ██║██║╚══██╔══╝██╔════╝██║  ██║"
    echo "  ██║  ███╗███████║███████╗██║ █╗ ██║██║   ██║   ██║     ███████║"
    echo "  ██║   ██║██╔══██║╚════██║██║███╗██║██║   ██║   ██║     ██╔══██║"
    echo "  ╚██████╔╝██║  ██║███████║╚███╔███╔╝██║   ██║   ╚██████╗██║  ██║"
    echo "  ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝ ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝"
    echo ""
    echo -e "${CYAN}Beautiful GitHub Account Switcher - One-line Installer${NC}"
    echo ""
}

# Main installation function
install_ghswitch() {
    show_banner
    
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
        print_error "Failed to get latest release information"
        exit 1
    fi
    
    print_success "Latest version: $tag_name"
    
    # Download binary
    local download_url="https://github.com/$REPO/releases/download/$tag_name/$binary_name"
    local temp_file="/tmp/$binary_name"
    
    print_status "Downloading $binary_name..."
    
    if ! curl -L -f -o "$temp_file" "$download_url"; then
        print_error "Failed to download binary"
        exit 1
    fi
    
    print_success "Download completed"
    
    # Make executable
    chmod +x "$temp_file"
    
    # Determine installation directory
    local final_install_dir=""
    
    # Try global installation first
    if [ -w "$INSTALL_DIR" ] || [ "$(id -u)" = "0" ]; then
        final_install_dir="$INSTALL_DIR"
        print_status "Installing to $final_install_dir..."
        cp "$temp_file" "$final_install_dir/ghswitch"
    else
        # Fall back to local installation
        final_install_dir="$LOCAL_INSTALL_DIR"
        print_status "Installing to $final_install_dir..."
        mkdir -p "$final_install_dir"
        cp "$temp_file" "$final_install_dir/ghswitch"
        
        # Check if ~/.local/bin is in PATH
        if [[ ":$PATH:" != *":$LOCAL_INSTALL_DIR:"* ]]; then
            print_warning "~/.local/bin is not in your PATH"
            echo ""
            echo "Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
            echo -e "${YELLOW}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
            echo ""
            echo "Then reload your shell or run:"
            echo -e "${YELLOW}source ~/.bashrc${NC}  # or ~/.zshrc"
        fi
    fi
    
    # Cleanup
    rm -f "$temp_file"
    
    print_success "GhSwitch installed successfully!"
    
    # Show usage info
    echo ""
    echo -e "${GREEN}🎉 Installation completed!${NC}"
    echo ""
    echo "Usage:"
    echo "  ${CYAN}ghswitch${NC}          # Run from anywhere"
    echo ""
    echo "Get started:"
    echo "  1. Run: ${CYAN}ghswitch${NC}"
    echo "  2. Add your GitHub accounts"
    echo "  3. Switch between accounts in your repositories"
    echo ""
    echo -e "${BLUE}For more information, visit: https://github.com/$REPO${NC}"
    echo ""
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
        echo "GhSwitch One-line Installation Script"
        echo ""
        echo "Usage: curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh | bash"
        echo ""
        echo "This script automatically detects your platform and installs"
        echo "the appropriate GhSwitch binary to /usr/local/bin or ~/.local/bin"
        exit 0
        ;;
    --version|-v)
        echo "GhSwitch Installation Script v2.0.0"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
