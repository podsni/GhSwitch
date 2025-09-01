#!/bin/bash

# NPM Publish Script for GhSwitch
# This script prepares and publishes the package to npm

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the right directory?"
    exit 1
fi

# Check if logged into npm
if ! npm whoami >/dev/null 2>&1; then
    print_error "Not logged into npm. Please run: npm login"
    exit 1
fi

print_status "Preparing NPM package..."

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
print_status "Package version: $VERSION"

# Check if version already exists
if npm view ghswitch@$VERSION >/dev/null 2>&1; then
    print_error "Version $VERSION already exists on npm"
    print_status "Please bump the version in package.json"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
bun install

# Run tests if they exist
if grep -q '"test"' package.json; then
    print_status "Running tests..."
    bun test
fi

# Make sure the binary is executable
chmod +x index.ts

# Build documentation
print_status "Checking documentation..."
if [ ! -f "README.md" ]; then
    print_warning "README.md not found"
fi

# Dry run first
print_status "Running npm publish dry-run..."
if npm publish --dry-run; then
    print_success "Dry run successful"
else
    print_error "Dry run failed"
    exit 1
fi

# Ask for confirmation
echo ""
print_warning "Ready to publish ghswitch@$VERSION to npm"
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Publish cancelled"
    exit 0
fi

# Publish to npm
print_status "Publishing to npm..."
if npm publish; then
    print_success "Successfully published ghswitch@$VERSION to npm"
    echo ""
    echo "Users can now install with:"
    echo "  npm install -g ghswitch"
    echo "  yarn global add ghswitch"
    echo "  pnpm add -g ghswitch"
    echo "  bun install -g ghswitch"
else
    print_error "Failed to publish to npm"
    exit 1
fi

print_success "NPM publish completed!"
