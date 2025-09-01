# Changelog

All notable changes to GhSwitch will be documented in this file.

## [v1.2.0] - 2024-01-XX

### 🆕 Added
- **Cross-Platform Support**: Full Windows, Linux, macOS compatibility
- **Platform Detection Utility**: Automatic OS detection and proper path handling
- **Enhanced Build System**: Organized standalone binary outputs in `build/` directory
- **Windows Compatibility Fixes**: Resolved figlet font loading issues on Windows

### 🔧 Fixed
- **Figlet Font Loading**: Graceful fallback system for ASCII art rendering on Windows
- **Path Handling**: Platform-aware SSH directory and config file paths
- **Git Credentials**: Cross-platform git credentials file location handling
- **TypeScript Compilation**: Fixed array indexing and multiselect prompt issues

### 🏗️ Infrastructure
- **Build Organization**: All build artifacts now organized in `build/` directory
- **GitHub Actions**: Updated CI/CD workflows for cross-platform builds
- **Type Safety**: Enhanced TypeScript strict mode compliance
- **Error Handling**: Improved null checks and error boundaries

### 🎨 UI/UX
- **Visual Consistency**: Platform-aware messages and path displays
- **User Experience**: Better error messages with platform-specific context
- **Interactive Prompts**: Fixed multiselect behavior for account method selection

### 📝 Documentation
- **Cross-Platform Notes**: Updated README with Windows compatibility information
- **Build Instructions**: Enhanced documentation for multi-platform builds

---

## [v1.1.0] - Previous Version

### Features
- Interactive CLI for GitHub account switching
- SSH and Token authentication support
- Repository-specific account management
- Beautiful terminal UI with gradients and colors
- SSH key generation and management

---

**Legend:**
- 🆕 Added: New features
- 🔧 Fixed: Bug fixes
- 🏗️ Infrastructure: Build, CI/CD, tooling
- 🎨 UI/UX: User interface improvements
- 📝 Documentation: Documentation updates
