import { describe, it, expect } from "bun:test";
import { parseRepoFromUrl, withGitSuffix } from "./git";

describe("git helpers", () => {
  it("parses SSH git@ URL", () => {
    expect(parseRepoFromUrl("git@github.com:owner/repo.git")).toBe("owner/repo.git");
  });

  it("parses SSH protocol URL", () => {
    expect(parseRepoFromUrl("ssh://git@github.com/owner/repo.git")).toBe("owner/repo.git");
  });

  it("parses HTTPS URL", () => {
    expect(parseRepoFromUrl("https://github.com/owner/repo")).toBe("owner/repo");
  });

  it("returns null for unknown format", () => {
    expect(parseRepoFromUrl("file:///tmp/owner/repo")).toBeNull();
  });

  it("adds .git suffix when missing", () => {
    expect(withGitSuffix("owner/repo")).toBe("owner/repo.git");
  });

  it("does not duplicate .git suffix", () => {
    expect(withGitSuffix("owner/repo.git")).toBe("owner/repo.git");
  });
});

