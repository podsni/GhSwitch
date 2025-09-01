#!/bin/bash

# GhSwitch Build Script
# Creates standalone executables for multiple platforms

set -e

echo "🔨 Building GhSwitch standalone executables..."
echo ""

# Create build directory
echo "📁 Creating build directory..."
mkdir -p build
echo ""

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -f build/* checksums.txt
echo ""

# Build for current platform (Linux x64)
echo "🐧 Building for Linux x64..."
bun build --compile --target=bun-linux-x64 --minify --sourcemap --outfile build/ghswitch ./index.ts
echo "✓ Linux x64 build complete: build/ghswitch"
echo ""

# Build for Linux ARM64
echo "🐧 Building for Linux ARM64..."
bun build --compile --target=bun-linux-arm64 --minify --sourcemap --outfile build/ghswitch-linux-arm64 ./index.ts
echo "✓ Linux ARM64 build complete: build/ghswitch-linux-arm64"
echo ""

# Build for Windows x64
echo "🪟 Building for Windows x64..."
bun build --compile --target=bun-windows-x64 --minify --sourcemap --outfile build/ghswitch.exe ./index.ts
echo "✓ Windows x64 build complete: build/ghswitch.exe"
echo ""

# Build for macOS x64
echo "🍎 Building for macOS x64..."
bun build --compile --target=bun-darwin-x64 --minify --sourcemap --outfile build/ghswitch-macos ./index.ts
echo "✓ macOS x64 build complete: build/ghswitch-macos"
echo ""

# Build for macOS ARM64 (Apple Silicon)
echo "🍎 Building for macOS ARM64 (Apple Silicon)..."
bun build --compile --target=bun-darwin-arm64 --minify --sourcemap --outfile build/ghswitch-macos-arm64 ./index.ts
echo "✓ macOS ARM64 build complete: build/ghswitch-macos-arm64"
echo ""

# Generate checksums
echo "📊 Generating checksums..."
cd build
sha256sum * > ../checksums.txt
cd ..
echo "✓ Checksums generated: checksums.txt"
echo ""

# Show file sizes
echo "📊 Build Summary:"
echo "────────────────────────────────────────"
ls -lh build/* checksums.txt 2>/dev/null | awk '{printf "%-30s %8s\n", $9, $5}' || true
echo "────────────────────────────────────────"
echo ""

echo "🎉 All builds completed successfully!"
echo ""
echo "🚀 Usage:"
echo "  Linux:   ./build/ghswitch"
echo "  Windows: ./build/ghswitch.exe"
echo "  macOS:   ./build/ghswitch-macos or ./build/ghswitch-macos-arm64"
echo ""
echo "📦 You can now distribute these standalone binaries!"
