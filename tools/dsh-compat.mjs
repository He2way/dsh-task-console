// Shared DSH compatibility probe: find the DSH checkouts on this machine and evaluate a plugin
// manifest against them with DSH's own rules.
//
// Used by `tools/check-dsh-compat.mjs` (the `npm run check:compat` gate) and by `smoke.mjs`,
// which fails when the newest local DSH would *skip* this plugin. That skip is silent at boot
// ("dsh: skipping profile bundle … is incompatible with dsh …"), so it is worth a test.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Local DSH npx checkouts that ship dsh-app-boot, newest first. */
export function localDshRuntimes() {
  const caches = [
    process.env.npm_config_cache ? join(process.env.npm_config_cache, "_npx") : null,
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "npm-cache", "_npx") : null,
    process.env.HOME ? join(process.env.HOME, ".npm", "_npx") : null,
    process.env.USERPROFILE ? join(process.env.USERPROFILE, ".npm", "_npx") : null,
  ].filter((path) => path !== null && existsSync(path));
  const runtimes = [];
  for (const root of [...new Set(caches)]) {
    let entries = [];
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const base = join(root, entry.name, "node_modules", "@deepseek-ai");
      const dshManifest = join(base, "dsh", "package.json");
      const boot = join(base, "dsh-app-boot", "lib", "index.js");
      if (!existsSync(dshManifest) || !existsSync(boot)) continue;
      let version;
      try {
        version = JSON.parse(readFileSync(dshManifest, "utf8")).version;
      } catch {
        continue;
      }
      if (typeof version !== "string") continue;
      runtimes.push({ dir: join(root, entry.name), version, boot });
    }
  }
  const seen = new Set();
  return runtimes
    .filter((runtime) => (seen.has(runtime.dir) ? false : (seen.add(runtime.dir), true)))
    .sort((left, right) => (left.version < right.version ? 1 : left.version > right.version ? -1 : 0));
}

/**
 * Evaluate one manifest against one runtime version using DSH's own evaluator.
 * @returns `{ ok: true }`, `{ ok: false, requirements }`, or `{ ok: null, reason }` when the
 *   evaluator cannot be imported (an older DSH, or a checkout without the boot package).
 */
export async function evaluateAgainst(manifest, runtimeVersion, bootPath) {
  try {
    const boot = await import(pathToFileURL(bootPath).href);
    if (typeof boot.evaluatePluginCompatibility !== "function") return { ok: null, reason: "evaluator missing" };
    const issue = boot.evaluatePluginCompatibility(manifest, {}, runtimeVersion);
    return issue === void 0 ? { ok: true } : { ok: false, requirements: issue.requirements };
  } catch (error) {
    return { ok: null, reason: error instanceof Error ? error.message : String(error) };
  }
}
