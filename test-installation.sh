#!/bin/bash

# Test Installation Script for GhSwitch
# Tests various installation methods

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

# Test curl installation
test_curl_install() {
    print_header "🧪 Testing Curl Installation"
    
    # Create temporary directory
    local test_dir=$(mktemp -d)
    local original_dir=$(pwd)
    
    print_status "Testing in: $test_dir"
    cd "$test_dir"
    
    # Download and run install script
    print_status "Downloading install script..."
    if curl -fsSL https://raw.githubusercontent.com/podsni/GhSwitch/main/install-curl.sh -o install.sh; then
        print_success "Download successful"
        
        print_status "Running installation..."
        if bash install.sh; then
            print_success "Installation successful"
            
            # Test if ghswitch is available
            if command -v ghswitch >/dev/null 2>&1; then
                print_success "ghswitch command is available"
                ghswitch --version || true
            else
                print_warning "ghswitch command not found in PATH"
            fi
        else
            print_error "Installation failed"
        fi
    else
        print_error "Failed to download install script"
    fi
    
    # Cleanup
    cd "$original_dir"
    rm -rf "$test_dir"
    echo ""
}

# Test local install script
test_local_install() {
    print_header "🧪 Testing Local Install Script"
    
    if [ ! -f "install-curl.sh" ]; then
        print_error "install-curl.sh not found"
        return 1
    fi
    
    # Create temporary directory
    local test_dir=$(mktemp -d)
    local original_dir=$(pwd)
    
    print_status "Testing in: $test_dir"
    
    # Copy install script
    cp install-curl.sh "$test_dir/"
    cd "$test_dir"
    
    print_status "Running local installation..."
    if bash install-curl.sh; then
        print_success "Local installation successful"
        
        # Test if binary works
        if [ -f ~/.local/bin/ghswitch ]; then
            print_success "Binary installed to ~/.local/bin/ghswitch"
            ~/.local/bin/ghswitch --version || true
        elif [ -f /usr/local/bin/ghswitch ]; then
            print_success "Binary installed to /usr/local/bin/ghswitch"
            /usr/local/bin/ghswitch --version || true
        else
            print_warning "Binary not found in expected locations"
        fi
    else
        print_error "Local installation failed"
    fi
    
    # Cleanup
    cd "$original_dir"
    rm -rf "$test_dir"
    echo ""
}

# Test NPM package
test_npm_package() {
    print_header "🧪 Testing NPM Package"
    
    # Check if package.json is ready for npm
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        return 1
    fi
    
    # Check if all required fields are present
    local name=$(node -p "require('./package.json').name" 2>/dev/null || echo "")
    local version=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
    local bin=$(node -p "require('./package.json').bin?.ghswitch" 2>/dev/null || echo "")
    
    print_status "Package name: $name"
    print_status "Version: $version"
    print_status "Binary path: $bin"
    
    if [ "$name" = "ghswitch" ]; then
        print_success "Package name is correct"
    else
        print_error "Package name should be 'ghswitch'"
    fi
    
    if [ -n "$version" ]; then
        print_success "Version is set"
    else
        print_error "Version not found"
    fi
    
    if [ "$bin" = "./index.ts" ]; then
        print_success "Binary path is correct"
    else
        print_error "Binary path should be './index.ts'"
    fi
    
    # Test npm pack
    print_status "Testing npm pack..."
    if npm pack --dry-run >/dev/null 2>&1; then
        print_success "npm pack test successful"
    else
        print_error "npm pack test failed"
    fi
    
    echo ""
}

# Test built binaries
test_binaries() {
    print_header "🧪 Testing Built Binaries"
    
    if [ ! -d "build" ]; then
        print_warning "Build directory not found. Run ./build.sh first"
        return 1
    fi
    
    # Test each binary
    for binary in build/*; do
        if [ -f "$binary" ] && [ -x "$binary" ]; then
            print_status "Testing $(basename "$binary")..."
            
            # Try to get version (with timeout)
            if timeout 10s "$binary" --version >/dev/null 2>&1; then
                print_success "$(basename "$binary") works"
            else
                print_warning "$(basename "$binary") may have issues"
            fi
        fi
    done
    
    echo ""
}

# Test file permissions
test_permissions() {
    print_header "🧪 Testing File Permissions"
    
    # Check script permissions
    local scripts=("build.sh" "install.sh" "install-curl.sh" "publish-npm.sh" "setup-distribution.sh")
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                print_success "$script is executable"
            else
                print_error "$script is not executable"
            fi
        else
            print_warning "$script not found"
        fi
    done
    
    # Check index.ts permission
    if [ -f "index.ts" ]; then
        if [ -x "index.ts" ]; then
            print_success "index.ts is executable"
        else
            print_warning "index.ts is not executable"
        fi
    fi
    
    echo ""
}

# Test package.json structure
test_package_json() {
    print_header "🧪 Testing package.json Structure"
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        return 1
    fi
    
    # Required fields
    local required_fields=("name" "version" "description" "bin" "files" "keywords" "author" "license" "homepage" "repository")
    
    for field in "${required_fields[@]}"; do
        local value=$(node -p "JSON.stringify(require('./package.json').$field)" 2>/dev/null || echo "null")
        
        if [ "$value" != "null" ] && [ "$value" != "undefined" ]; then
            print_success "$field: $value"
        else
            print_warning "$field: missing or invalid"
        fi
    done
    
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
    echo -e "${BLUE}Installation Test Suite${NC}"
    echo ""
    
    case "${1:-all}" in
        "curl")
            test_curl_install
            ;;
        "local")
            test_local_install
            ;;
        "npm")
            test_npm_package
            ;;
        "binaries")
            test_binaries
            ;;
        "permissions")
            test_permissions
            ;;
        "package")
            test_package_json
            ;;
        "all"|*)
            test_permissions
            test_package_json
            test_binaries
            test_npm_package
            test_local_install
            print_header "🎉 All Tests Completed"
            ;;
    esac
}

# Handle arguments
case "${1:-}" in
    "--help"|"-h")
        echo "GhSwitch Installation Test Suite"
        echo ""
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  curl         Test curl installation"
        echo "  local        Test local install script"
        echo "  npm          Test NPM package"
        echo "  binaries     Test built binaries"
        echo "  permissions  Test file permissions"
        echo "  package      Test package.json structure"
        echo "  all          Run all tests (default)"
        echo ""
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac
