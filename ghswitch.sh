#!/bin/bash

# GhSwitch - Cross-shell compatibility wrapper
# This script ensures GhSwitch works in bash, zsh, and other shells

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Try to run with bun first (fastest)
if command -v bun >/dev/null 2>&1; then
    exec bun run "$SCRIPT_DIR/index.ts" "$@"
# Fallback to node if available
elif command -v node >/dev/null 2>&1; then
    # Check if we have TypeScript support
    if command -v tsx >/dev/null 2>&1; then
        exec tsx "$SCRIPT_DIR/index.ts" "$@"
    elif command -v ts-node >/dev/null 2>&1; then
        exec ts-node "$SCRIPT_DIR/index.ts" "$@"
    else
        echo "Error: GhSwitch requires either:"
        echo "  1. Bun runtime (recommended): https://bun.sh"
        echo "  2. Node.js with tsx or ts-node for TypeScript support"
        echo ""
        echo "Install Bun (fastest option):"
        echo "  curl -fsSL https://bun.sh/install | bash"
        echo ""
        echo "Or install tsx with Node.js:"
        echo "  npm install -g tsx"
        exit 1
    fi
else
    echo "Error: No compatible JavaScript runtime found."
    echo ""
    echo "GhSwitch requires either:"
    echo "  1. Bun runtime (recommended): https://bun.sh"
    echo "  2. Node.js with npm/yarn/pnpm"
    echo ""
    echo "Install Bun (fastest option):"
    echo "  curl -fsSL https://bun.sh/install | bash"
    echo ""
    echo "Or install Node.js from: https://nodejs.org"
    exit 1
fi
