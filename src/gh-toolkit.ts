import prompts from "prompts";
import { run, exec } from "./utils/shell";
import { createSpinner, showError, showInfo, showSuccess, stylePrompt, colors } from "./utils/ui";
import { getCurrentRemoteInfo } from "./git";
import { ensureGhInstalled } from "./gh-install";
import { ghAuthFlow, ghGetActiveUser } from "./gh-auth";
import { listFilesRecursive } from "./utils/fs";
import { fuzzyFilter } from "./utils/search";

type Issue = { number: number; title?: string };
type PR = { number: number; title?: string; headRefName?: string };
type Repo = { nameWithOwner: string; description?: string; visibility?: string; isPrivate?: boolean; isFork?: boolean; stargazerCount?: number; primaryLanguage?: { name?: string } | null; pushedAt?: string };
type Gist = { id: string; description?: string; public?: boolean; updatedAt?: string; files?: Array<{ name: string }> };

export type RepoSummary = {
  nameWithOwner: string;
  visibility: string;
  language?: string;
  stars?: number;
  pushed?: string;
  description?: string;
};

export type GistSummary = {
  id: string;
  public: boolean;
  files: number;
  updated?: string;
  title: string;
};

export function summarizeRepo(r: Repo): RepoSummary {
  const visibility = r.isPrivate ? "private" : (r.visibility ? String(r.visibility).toLowerCase() : "public");
  const language = r.primaryLanguage?.name || undefined;
  const stars = typeof r.stargazerCount === "number" ? r.stargazerCount : undefined;
  const pushed = r.pushedAt ? new Date(r.pushedAt).toISOString().slice(0,10) : undefined;
  const description = r.description || undefined;
  return { nameWithOwner: r.nameWithOwner, visibility, language, stars, pushed, description };
}

export function filterReposByQuery(repos: Repo[], q?: string): Repo[] {
  if (!q) return repos;
  const s = q.toLowerCase();
  return repos.filter(r => (r.nameWithOwner||'').toLowerCase().includes(s) || (r.description||'').toLowerCase().includes(s));
}

export function summarizeGist(g: Gist): GistSummary {
  const files = Array.isArray(g.files) ? g.files.length : 0;
  const updated = g.updatedAt ? new Date(g.updatedAt).toISOString().slice(0,10) : undefined;
  const title = g.description || (Array.isArray(g.files) && g.files[0]?.name) || "(no description)";
  return { id: g.id, public: !!g.public, files, updated, title };
}

export function filterGistsByQuery(gists: Gist[], q?: string): Gist[] {
  if (!q) return gists;
  const s = q.toLowerCase();
  return gists.filter(g => (g.id||'').toLowerCase().includes(s) || (g.description||'').toLowerCase().includes(s) || (Array.isArray(g.files) && g.files.some(f=> (f.name||'').toLowerCase().includes(s))));
}

async function getDefaultRepo(): Promise<string | null> {
  const info = await getCurrentRemoteInfo(process.cwd());
  return info?.repoPath || null;
}

async function promptRepo(initial?: string | null): Promise<string | null> {
  // Try to get suggestions from gh repo list
  let suggestions: string[] = [];
  try {
    const res = await exec(["gh", "repo", "list", "--limit", "100", "--json", "nameWithOwner", "--source"]);
    if (res.code === 0) {
      const arr = JSON.parse(res.stdout || "[]");
      suggestions = Array.isArray(arr) ? arr.map((r: any) => r?.nameWithOwner).filter(Boolean) : [];
    }
  } catch {}
  if (suggestions.length) {
    const choices = suggestions.map((s) => ({ title: s, value: s }));
    const suggest = async (input: string, _choices: any[]) => fuzzyFilter(choices, (c:any) => String(c.title), input || "");
    const { repo } = await prompts({ type: "autocomplete", name: "repo", message: "owner/repo", choices, suggest, initial: initial || undefined });
    return repo || initial || null;
  }
  const ans = await prompts({ type: "text", name: "repo", message: "owner/repo", initial: initial || undefined, validate: (v) => (!v || /.+\/.+/.test(v)) ? true : "Use owner/repo" });
  return ans.repo || initial || null;
}

async function listIssues(repo?: string): Promise<Issue[]> {
  const args = ["gh", "issue", "list", "--limit", "50", "--json", "number,title"]; if (repo) args.push("--repo", repo);
  const res = await exec(args); if (res.code !== 0) return []; try { return JSON.parse(res.stdout || "[]"); } catch { return []; }
}

async function listPRs(repo?: string): Promise<PR[]> {
  const args = ["gh", "pr", "list", "--limit", "50", "--json", "number,title,headRefName"]; if (repo) args.push("--repo", repo);
  const res = await exec(args); if (res.code !== 0) return []; try { return JSON.parse(res.stdout || "[]"); } catch { return []; }
}

async function searchRepos(q: string, opts: { owner?: string; mine?: boolean; language?: string; sort?: "stars" | "updated"; order?: "asc" | "desc" } = {}, limit = 50): Promise<Repo[]> {
  const args = ["gh", "search", "repos", q, "--limit", String(limit), "--json", "nameWithOwner,description,visibility,isPrivate,isFork,stargazerCount,primaryLanguage,pushedAt"];
  if (opts.mine) args.push("--owner", "@me");
  if (opts.owner && !opts.mine) args.push("--owner", opts.owner);
  if (opts.language) args.push("--language", opts.language);
  if (opts.sort) args.push("--sort", opts.sort);
  if (opts.order) args.push("--order", opts.order);
  const res = await exec(args);
  if (res.code !== 0) return [];
  try { return JSON.parse(res.stdout || "[]"); } catch { return []; }
}

async function listRepos(scope: "source" | "starred" | "all" = "source", limit = 50): Promise<Repo[]> {
  const args = ["gh", "repo", "list", "--limit", String(limit), "--json", "nameWithOwner,description,visibility,isPrivate,isFork,stargazerCount,primaryLanguage,pushedAt"];
  if (scope === "source") args.push("--source");
  if (scope === "starred") args.push("--starred");
  const res = await exec(args);
  if (res.code !== 0) return [];
  try { return JSON.parse(res.stdout || "[]"); } catch { return []; }
}

async function listGists(limit = 50): Promise<Gist[]> {
  const args = ["gh", "gist", "list", "--limit", String(limit), "--json", "id,description,public,updatedAt,files"];
  const res = await exec(args);
  if (res.code !== 0) return [];
  try { return JSON.parse(res.stdout || "[]"); } catch { return []; }
}

function printRepoList(repos: Repo[]) {
  if (!repos.length) { showInfo("No repositories found."); return; }
  repos.forEach(r => {
    const s = summarizeRepo(r);
    const name = colors.accent(s.nameWithOwner);
    const vis = s.visibility === 'private' ? colors.warning("private") : colors.muted(s.visibility || 'public');
    const lang = s.language ? colors.secondary(s.language) : colors.muted("-");
    const stars = typeof s.stars === "number" ? `★ ${s.stars}` : "";
    const pushed = s.pushed ? colors.muted(s.pushed) : colors.muted("-");
    const desc = s.description ? colors.text(s.description) : colors.muted("(no description)");
    console.log(`${name} ${colors.muted("[")}${vis}${colors.muted("]")} ${lang} ${colors.muted(stars)} ${pushed}`);
    console.log(`  ${desc}`);
  });
  console.log(colors.muted(`Total: ${repos.length}`));
}

function printGistList(gists: Gist[]) {
  if (!gists.length) { showInfo("No gists found."); return; }
  gists.forEach(g => {
    const s = summarizeGist(g);
    const pub = s.public ? colors.success("public") : colors.muted("secret");
    const updated = s.updated ? colors.muted(s.updated) : colors.muted("-");
    console.log(`${colors.accent(s.id)} ${pub} ${colors.muted(`files:${s.files}`)} ${updated}`);
    console.log(`  ${colors.text(s.title)}`);
  });
  console.log(colors.muted(`Total: ${gists.length}`));
}

export async function ghToolkitFlow() {
  const installed = await ensureGhInstalled(true); if (!installed) return;
  while (true) {
    // Header: show active GH user if available
    try {
      const u = await ghGetActiveUser();
      if (u?.login) console.log(colors.muted(`Active GitHub user: ${colors.accent(u.login)}${u.name? ' ('+u.name+')':''}`));
    } catch {}
    const { section } = await prompts({ type: "select", name: "section", message: stylePrompt("GitHub CLI Toolkit"), choices: [
      { title: "Auth", value: "auth" },
      { title: "Repositories", value: "repo" },
      { title: "Issues", value: "issue" },
      { title: "Pull Requests", value: "pr" },
      { title: "Gists", value: "gist" },
      { title: "Utilities", value: "util" },
      { title: colors.muted("Back"), value: "back" },
    ], initial: 0 });
    if (!section || section === "back") break;

    if (section === "auth") { await ghAuthFlow(); continue; }

    if (section === "repo") {
      const { action } = await prompts({ type: "select", name: "action", message: stylePrompt("Repositories"), choices: [
        { title: "List", value: "list" },
        { title: "Search", value: "search" },
        { title: "Clone", value: "clone" },
        { title: "Create", value: "create" },
        { title: "Fork", value: "fork" },
        { title: "View", value: "view" },
        { title: "Delete", value: "delete" },
        { title: colors.muted("Back"), value: "back" }, ]});
      if (!action || action === "back") continue;
      if (action === "search") {
        const base = await prompts([
          { type: "text", name: "q", message: "Search query", validate: (v)=>!!v || "Required" },
          { type: "select", name: "scope", message: "Scope", choices: [ { title: "All", value: "all" }, { title: "Mine (@me)", value: "mine" }, { title: "Specific owner", value: "owner" } ], initial: 0 },
          { type: (prev:any, vals:any)=> vals.scope === 'owner' ? 'text' : null, name: "owner", message: "Owner (user/org)" },
          { type: "text", name: "language", message: "Language (optional)" },
          { type: "select", name: "sort", message: "Sort", choices: [ { title: "Stars", value: "stars" }, { title: "Updated", value: "updated" } ], initial: 0 },
          { type: "select", name: "order", message: "Order", choices: [ { title: "Desc", value: "desc" }, { title: "Asc", value: "asc" } ], initial: 0 },
        ]);
        const spinner = createSpinner("Searching repositories..."); spinner.start();
        const repos = await searchRepos(base.q, { mine: base.scope==='mine', owner: base.scope==='owner'? base.owner: undefined, language: base.language || undefined, sort: base.sort, order: base.order });
        spinner.stop();
        printRepoList(repos);
        if (repos.length) {
          const choices = repos.map(r=>({ title: r.nameWithOwner, value: r.nameWithOwner }));
          const { sel } = await prompts({ type: "autocomplete", name: "sel", message: "Select repo", choices });
          if (sel) {
            const { act } = await prompts({ type: "select", name: "act", message: "Action", choices: [ { title: "View", value: "view" }, { title: "Clone", value: "clone" }, { title: "Fork", value: "fork" }, { title: "Cancel", value: "cancel" } ] });
            if (act === 'view') { try { await run(["gh", "repo", "view", sel]); showInfo(`URL: https://github.com/${sel}`); } catch (e:any) { showError(e?.message||String(e)); } }
            if (act === 'clone') { const { dir } = await prompts({ type: "text", name: "dir", message: "Destination directory (optional)" }); const spin = createSpinner("Cloning repo..."); spin.start(); try { await run(["gh", "repo", "clone", sel, ...(dir ? [dir] : [])]); spin.stop(); showSuccess("Clone completed"); } catch (e:any) { spin.stop(); showError(e?.message||String(e)); } }
            if (act === 'fork') { const spin = createSpinner("Forking repository..."); spin.start(); try { await run(["gh", "repo", "fork", sel, "--remote"]); spin.stop(); showSuccess("Forked and remote added"); } catch (e:any) { spin.stop(); showError(e?.message||String(e)); } }
          }
        }
        continue;
      }
      if (action === "list") {
        const { scope } = await prompts({ type: "select", name: "scope", message: "Scope", choices: [
          { title: "My repositories", value: "source" },
          { title: "Starred", value: "starred" },
          { title: "All visible", value: "all" },
        ] as any, initial: 0 });
        const spinner = createSpinner("Fetching repositories..."); spinner.start();
        let repos = await listRepos(scope as any, 50); spinner.stop();
        const { q } = await prompts({ type: "text", name: "q", message: "Filter (contains, optional)" });
        if (q) { const s = (q as string).toLowerCase(); repos = repos.filter(r=> (r.nameWithOwner||'').toLowerCase().includes(s) || (r.description||'').toLowerCase().includes(s)); }
        printRepoList(repos);
        const { openOne } = await prompts({ type: "confirm", name: "openOne", message: stylePrompt("View one repo details?", "confirm"), initial: false });
        if (openOne) {
          const choices = repos.map(r=>({ title: r.nameWithOwner, value: r.nameWithOwner }));
          const { repoSel } = await prompts({ type: choices.length? "autocomplete":"text", name: "repoSel", message: "Choose repo", choices });
          if (repoSel) { try { await run(["gh", "repo", "view", repoSel]); showInfo(`URL: https://github.com/${repoSel}`); } catch (e:any) { showError(e?.message||String(e)); } }
        }
        continue;
      }
      if (action === "clone") { const repoInit = await promptRepo(await getDefaultRepo()); if (!repoInit) continue; const { dir } = await prompts({ type: "text", name: "dir", message: "Destination directory (optional)" }); const spinner = createSpinner("Cloning repo..."); spinner.start(); try { await run(["gh", "repo", "clone", repoInit, ...(dir ? [dir] : [])]); spinner.stop(); showSuccess("Clone completed"); } catch (e: any) { spinner.stop(); showError(e?.message || String(e)); } }
      if (action === "create") {
        const ans = await prompts([
          { type: "text", name: "name", message: "Repository name" },
          { type: "text", name: "desc", message: "Description (optional)" },
          { type: "toggle", name: "private", message: "Private?", initial: true, active: "yes", inactive: "no" }
        ]);
        if (!ans?.name) continue;
        const spinner = createSpinner("Creating repository..."); spinner.start();
        try {
          const args = ["gh", "repo", "create", ans.name, "--confirm", ans.private ? "--private" : "--public"]; 
          if (ans.desc) args.push("--description", ans.desc);
          await run(args);
          spinner.stop();
          try {
            const { stdout } = await exec(["gh", "repo", "view", ans.name, "--json", "url", "-q", ".url"]);
            const url = (stdout || '').trim();
            if (url) showSuccess(`Repository created: ${url}`); else showSuccess("Repository created");
          } catch { showSuccess("Repository created"); }
        } catch (e: any) { spinner.stop(); showError(e?.message || String(e)); }
      }
      if (action === "fork") { const repo = await promptRepo(await getDefaultRepo()); if (!repo) continue; const spinner = createSpinner("Forking repository..."); spinner.start(); try { await run(["gh", "repo", "fork", repo, "--remote"]); spinner.stop(); showSuccess("Forked and remote added"); } catch (e: any) { spinner.stop(); showError(e?.message || String(e)); } }
      if (action === "view") { const repo = await promptRepo(await getDefaultRepo()); if (!repo) continue; try { await run(["gh", "repo", "view", repo]); showInfo(`URL: https://github.com/${repo}`); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "delete") { const repo = await promptRepo(await getDefaultRepo()); if (!repo) continue; const { confirm } = await prompts({ type: "confirm", name: "confirm", message: stylePrompt(`Delete ${repo}?`, "confirm"), initial: false }); if (!confirm) continue; const spinner = createSpinner("Deleting repository..."); spinner.start(); try { await run(["gh", "repo", "delete", repo, "--yes"]); spinner.stop(); showSuccess("Repository deleted"); } catch (e: any) { spinner.stop(); showError(e?.message || String(e)); } }
      continue;
    }

    if (section === "issue") {
      const repo = await promptRepo(await getDefaultRepo());
      const { action } = await prompts({ type: "select", name: "action", message: stylePrompt("Issues"), choices: [ { title: "List", value: "list" }, { title: "Create", value: "create" }, { title: "View", value: "view" }, { title: "Close", value: "close" }, { title: "Reopen", value: "reopen" }, { title: colors.muted("Back"), value: "back" } ]});
      if (!action || action === "back") continue;
      if (action === "list") { const spinner = createSpinner("Fetching issues..."); spinner.start(); const issues = await listIssues(repo || undefined); spinner.stop(); if (!issues.length) { showInfo("No issues found or not accessible."); continue; } issues.forEach(i => console.log(`${colors.accent(`#${i.number}`)} ${i.title || ''}`)); continue; }
      const issues = await listIssues(repo || undefined); const choices = issues.map(i => ({ title: `#${i.number} ${i.title || ''}`, value: String(i.number) })); const { num } = await prompts({ type: choices.length ? "autocomplete" : "text", name: "num", message: "Issue number", choices, initial: choices[0]?.value }); const id = num || (await prompts({ type: "text", name: "n", message: "Issue number" })).n; if (!id) continue;
      if (action === "view") { try { await run(["gh", "issue", "view", id, ...(repo ? ["--repo", repo] : [])]); if (repo) showInfo(`URL: https://github.com/${repo}/issues/${id}`); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "close") { try { await run(["gh", "issue", "close", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("Issue closed"); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "reopen") { try { await run(["gh", "issue", "reopen", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("Issue reopened"); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "create") { const ans = await prompts([{ type: "text", name: "title", message: "Title" }, { type: "text", name: "body", message: "Body (optional)" }]); if (!ans?.title) continue; const args = ["gh", "issue", "create", "--title", ans.title]; if (ans.body) args.push("--body", ans.body); if (repo) args.push("--repo", repo); try { await run(args); showSuccess("Issue created"); } catch (e: any) { showError(e?.message || String(e)); } }
      continue;
    }

    if (section === "pr") {
      const repo = await promptRepo(await getDefaultRepo());
      const { action } = await prompts({ type: "select", name: "action", message: stylePrompt("Pull Requests"), choices: [ { title: "List", value: "list" }, { title: "Create", value: "create" }, { title: "View", value: "view" }, { title: "Checkout", value: "checkout" }, { title: "Merge", value: "merge" }, { title: "Close", value: "close" }, { title: colors.muted("Back"), value: "back" } ]});
      if (!action || action === "back") continue;
      if (action === "list") { const spinner = createSpinner("Fetching PRs..."); spinner.start(); const prs = await listPRs(repo || undefined); spinner.stop(); if (!prs.length) { showInfo("No PRs found or not accessible."); continue; } prs.forEach(p => console.log(`${colors.accent(`#${p.number}`)} ${p.title || ''} ${colors.muted(p.headRefName ? '('+p.headRefName+')' : '')}`)); continue; }
      const prs = await listPRs(repo || undefined); const choices = prs.map(p => ({ title: `#${p.number} ${p.title || ''}`, value: String(p.number) })); const { num } = await prompts({ type: choices.length ? "autocomplete" : "text", name: "num", message: "PR number", choices, initial: choices[0]?.value }); const id = num || (await prompts({ type: "text", name: "n", message: "PR number" })).n; if (!id) continue;
      if (action === "view") { try { await run(["gh", "pr", "view", id, ...(repo ? ["--repo", repo] : [])]); if (repo) showInfo(`URL: https://github.com/${repo}/pull/${id}`); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "checkout") { try { await run(["gh", "pr", "checkout", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("Checked out PR branch"); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "merge") { const { method } = await prompts({ type: "select", name: "method", message: "Merge method", choices: [ { title: "Create merge commit", value: "merge" }, { title: "Squash and merge", value: "squash" }, { title: "Rebase and merge", value: "rebase" } ]}); try { await run(["gh", "pr", "merge", id, "--auto", `--${method}`, ...(repo ? ["--repo", repo] : [])]); showSuccess("Merge triggered"); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "close") { try { await run(["gh", "pr", "close", id, ...(repo ? ["--repo", repo] : [])]); showSuccess("PR closed"); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "create") {
        const { fill } = await prompts({ type: "confirm", name: "fill", message: stylePrompt("Use --fill from commits?", "confirm"), initial: true });
        const args = ["gh", "pr", "create"]; if (fill) args.push("--fill"); if (repo) args.push("--repo", repo);
        try {
          await run(args);
          try {
            const extra = repo ? ["--repo", repo] : [];
            const { stdout } = await exec(["gh", "pr", "view", ...extra, "--json", "url", "-q", ".url"]);
            const url = (stdout || '').trim();
            if (url) showSuccess(`PR created: ${url}`); else showSuccess("PR creation initiated");
          } catch { showSuccess("PR creation initiated"); }
        } catch (e: any) { showError(e?.message || String(e)); }
      }
      continue;
    }

    if (section === "gist") {
      const { action } = await prompts({ type: "select", name: "action", message: stylePrompt("Gists"), choices: [ { title: "Create from file", value: "create" }, { title: "Search", value: "search" }, { title: "List", value: "list" }, { title: "View", value: "view" }, { title: "Delete", value: "delete" }, { title: colors.muted("Back"), value: "back" } ]});
      if (!action || action === "back") continue;
      if (action === "search") {
        const { q } = await prompts({ type: "text", name: "q", message: "Search text (description/id/filename)" });
        const spinner = createSpinner("Fetching gists..."); spinner.start();
        let gists = await listGists(200); spinner.stop();
        const s = (q || '').toLowerCase();
        if (s) {
          gists = gists.filter(g => (g.id||'').toLowerCase().includes(s) || (g.description||'').toLowerCase().includes(s) || (Array.isArray(g.files) && g.files.some(f=> (f.name||'').toLowerCase().includes(s))));
        }
        printGistList(gists);
        if (gists.length) {
          const choices = gists.map(g=>({ title: `${g.id} ${(g.description||'').slice(0,60)}`, value: g.id }));
          const { gid } = await prompts({ type: "autocomplete", name: "gid", message: "Select gist", choices });
          if (gid) { try { await run(["gh", "gist", "view", gid]); showInfo(`URL: https://gist.github.com/${gid}`); } catch (e:any) { showError(e?.message||String(e)); } }
        }
        continue;
      }
      if (action === "create") {
        const files = listFilesRecursive(process.cwd(), { max: 300 });
        const answers: any = await prompts([
          { type: files.length ? "autocomplete" : "text", name: "file", message: "Path to file", choices: files.map((f) => ({ title: f, value: f })), suggest: async (input: string, _choices:any[]) => fuzzyFilter(files, (s)=>s, input || "").map(s=>({ title: s, value: s })) },
          { type: "text", name: "desc", message: "Description (optional)" },
          { type: "toggle", name: "public", message: "Public?", initial: false, active: "yes", inactive: "no" },
        ]);
        if (!answers?.file) continue;
        const args = ["gh", "gist", "create", answers.file];
        if (answers.desc) args.push("-d", answers.desc);
        if (answers.public) args.push("--public");
        try {
          const res = await exec(args);
          const url = (res.stdout || '').trim();
          if (url) {
            showSuccess(`Gist created: ${url}`);
          } else {
            showSuccess("Gist created");
          }
        } catch (e: any) { showError(e?.message || String(e)); }
      }
      if (action === "list") {
        const spinner = createSpinner("Fetching gists..."); spinner.start();
        let gists = await listGists(50); spinner.stop();
        const { q } = await prompts({ type: "text", name: "q", message: "Filter (contains, optional)" });
        if (q) { const s = (q as string).toLowerCase(); gists = gists.filter(g=> (g.description||'').toLowerCase().includes(s) || (g.id||'').toLowerCase().includes(s)); }
        printGistList(gists);
        const { viewOne } = await prompts({ type: "confirm", name: "viewOne", message: stylePrompt("View one gist?", "confirm"), initial: false });
        if (viewOne) {
          const choices = gists.map(g=>({ title: `${g.id} ${(g.description||'').slice(0,60)}`, value: g.id }));
          const { gid } = await prompts({ type: choices.length? "autocomplete":"text", name: "gid", message: "Gist ID", choices });
          if (gid) { try { await run(["gh", "gist", "view", gid]); showInfo(`URL: https://gist.github.com/${gid}`); } catch (e:any) { showError(e?.message||String(e)); } }
        }
      }
      if (action === "view") { const { id } = await prompts({ type: "text", name: "id", message: "Gist ID" }); if (!id) continue; try { await run(["gh", "gist", "view", id]); showInfo(`URL: https://gist.github.com/${id}`); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "delete") { const { id } = await prompts({ type: "text", name: "id", message: "Gist ID" }); if (!id) continue; const { confirm } = await prompts({ type: "confirm", name: "confirm", message: stylePrompt("Delete this gist?", "confirm"), initial: false }); if (!confirm) continue; try { await run(["gh", "gist", "delete", id]); showSuccess("Gist deleted"); } catch (e: any) { showError(e?.message || String(e)); } }
      continue;
    }

    if (section === "util") {
      const { action } = await prompts({ type: "select", name: "action", message: stylePrompt("Utilities"), choices: [ { title: "gh help", value: "help" }, { title: "Set alias (e.g., co)", value: "alias" }, { title: "Completion instructions", value: "compl" }, { title: "gh api /user", value: "api" }, { title: colors.muted("Back"), value: "back" } ]});
      if (!action || action === "back") continue;
      if (action === "help") { try { await run(["gh", "help"]); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "alias") { const { name, value } = await prompts([{ type: "text", name: "name", message: "Alias name", initial: "co" }, { type: "text", name: "value", message: "Alias value", initial: "pr checkout" }]); if (!name || !value) continue; try { await run(["gh", "alias", "set", name, value]); showSuccess("Alias set"); } catch (e: any) { showError(e?.message || String(e)); } }
      if (action === "compl") { console.log(colors.muted("Run one of the following to enable completion:")); console.log("bash: eval \"$(gh completion -s bash)\""); console.log("zsh:  eval \"$(gh completion -s zsh)\""); console.log("fish: gh completion -s fish | source"); }
      if (action === "api") { const { path } = await prompts({ type: "text", name: "path", message: "API path", initial: "/user" }); if (!path) continue; try { await run(["gh", "api", path]); } catch (e: any) { showError(e?.message || String(e)); } }
      continue;
    }
  }
}
