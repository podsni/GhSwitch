import { describe, it, expect } from "bun:test";
import { summarizeRepo, filterReposByQuery, summarizeGist, filterGistsByQuery } from "./gh-toolkit";

describe("gh-toolkit summaries", () => {
  it("summarizes repo fields correctly", () => {
    const repo: any = {
      nameWithOwner: "owner/repo",
      visibility: "PUBLIC",
      isPrivate: false,
      primaryLanguage: { name: "TypeScript" },
      stargazerCount: 42,
      pushedAt: "2024-01-02T10:00:00Z",
      description: "Test repo",
    };
    const s = summarizeRepo(repo);
    expect(s.nameWithOwner).toBe("owner/repo");
    expect(s.visibility).toBe("public");
    expect(s.language).toBe("TypeScript");
    expect(s.stars).toBe(42);
    expect(s.pushed).toBe("2024-01-02");
    expect(s.description).toBe("Test repo");
  });

  it("filters repos by query", () => {
    const repos: any[] = [
      { nameWithOwner: "a/alpha", description: "first" },
      { nameWithOwner: "b/bravo", description: "second" },
      { nameWithOwner: "c/charlie", description: "third" },
    ];
    const out = filterReposByQuery(repos as any, "bra");
    expect(out.length).toBe(1);
    expect(out[0].nameWithOwner).toBe("b/bravo");
  });

  it("summarizes gist fields correctly", () => {
    const gist: any = {
      id: "abc123",
      public: true,
      updatedAt: "2023-12-31T23:59:59Z",
      files: [{ name: "file1.txt" }, { name: "file2.ts" }],
      description: "My gist",
    };
    const s = summarizeGist(gist);
    expect(s.id).toBe("abc123");
    expect(s.public).toBe(true);
    expect(s.files).toBe(2);
    expect(s.updated).toBe("2023-12-31");
    expect(s.title).toBe("My gist");
  });

  it("filters gists by id/description/filename", () => {
    const gists: any[] = [
      { id: "id1", description: "utils", files: [{ name: "helpers.ts" }] },
      { id: "id2", description: "notes", files: [{ name: "readme.md" }] },
    ];
    expect(filterGistsByQuery(gists as any, "id1").length).toBe(1);
    expect(filterGistsByQuery(gists as any, "utils").length).toBe(1);
    expect(filterGistsByQuery(gists as any, "readme").length).toBe(1);
    expect(filterGistsByQuery(gists as any, "xyz").length).toBe(0);
  });
});

