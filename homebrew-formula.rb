# Homebrew Formula for GhSwitch
# This file should be placed in: homebrew-ghswitch/Formula/ghswitch.rb

class Ghswitch < Formula
  desc "Beautiful GitHub Account Switcher - Interactive CLI tool for managing multiple GitHub accounts"
  homepage "https://github.com/podsni/GhSwitch"
  url "https://github.com/podsni/GhSwitch/releases/download/v1.2.0/ghswitch-macos.tar.gz"
  sha256 "REPLACE_WITH_ACTUAL_SHA256"
  license "MIT"

  def install
    bin.install "ghswitch"
  end

  test do
    system "#{bin}/ghswitch", "--version"
  end
end
