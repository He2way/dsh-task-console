// Check this plugin's declared DSH compatibility against the DSH runtimes on this machine.
//
//   npm run check:compat
//
// DSH silently *skips* a profile bundle whose `engines.dsh` does not include the running
// version ("dsh: skipping profile bundle … is incompatible with dsh …"), so a DSH upgrade can
// make the whole workbench disappear with no error from the plugin. This check runs DSH's own
// evaluator over every local npx checkout, so that mistake shows up here instead of at boot.
//
// Exit codes: 0 = the newest local runtime is compatible, 1 = it is not, 2 = no DSH found.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { localDshRuntimes, evaluateAgainst } from "./dsh-compat.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(HERE, "..", "package.json"), "utf8"));

console.log("plugin   " + manifest.name + "@" + manifest.version);
console.log("engines  dsh " + JSON.stringify(manifest.engines?.dsh ?? null));
const runtimes = localDshRuntimes();
if (runtimes.length === 0) {
  console.log("SKIP: no local DSH checkout was found (set npm_config_cache, or install dsh)");
  process.exit(2);
}

console.log("");
let ok = true;
for (const runtime of runtimes) {
  const result = await evaluateAgainst(manifest, runtime.version, runtime.boot);
  let label;
  if (result.ok === null) label = "UNCHECKED  (" + result.reason + ")";
  else if (result.ok === true) label = "COMPATIBLE";
  else {
    label = "INCOMPATIBLE  needs " + JSON.stringify(result.requirements);
    ok = false;
  }
  console.log("  " + label.padEnd(56) + " dsh " + runtime.version);
}
console.log("");
console.log(ok ? "RESULT: OK — the newest local DSH will load this plugin" : "RESULT: FAIL — a local DSH would skip this plugin");
process.exit(ok ? 0 : 1);
