import { $ } from "bun";

export async function run(cmd: string[], opts: { cwd?: string } = {}) {
  const p = $`${{ raw: cmd.map((c) => (/\s/.test(c) ? JSON.stringify(c) : c)).join(" ") }}`.cwd(
    opts.cwd ?? process.cwd()
  );
  try {
    const { stdout } = await p.quiet();
    return stdout.toString().trim();
  } catch (e: any) {
    const msg = e?.stderr ? e.stderr.toString() : String(e);
    throw new Error(msg);
  }
}

export async function exec(cmd: string[], opts: { cwd?: string } = {}) {
  const p = $`${{ raw: cmd.map((c) => (/\s/.test(c) ? JSON.stringify(c) : c)).join(" ") }}`.cwd(
    opts.cwd ?? process.cwd()
  );
  try {
    const res: any = await p.quiet();
    const stdout = res?.stdout ? res.stdout.toString() : "";
    const stderr = res?.stderr ? res.stderr.toString() : "";
    const code = typeof res?.exitCode === "number" ? res.exitCode : 0;
    return { code, stdout, stderr };
  } catch (e: any) {
    return {
      code: typeof e?.exitCode === "number" ? e.exitCode : 1,
      stdout: e?.stdout ? e.stdout.toString() : "",
      stderr: e?.stderr ? e.stderr.toString() : String(e),
    };
  }
}
