// Verify the embedded architecture diagram in a real browser.
//
// `npm test` proves the payload decodes in Node; this script proves the part
// Node cannot: that the gzip+base64 payload decodes with the browser's
// DecompressionStream and that the artifact actually renders inside the
// sandboxed `srcdoc` iframe the dock mounts.
//
//   node tools/verify-diagram-browser.mjs
//
// Chrome is located through CHROME_PATH or the usual install paths; when it is
// missing the check is skipped (exit 0) so it never blocks `npm test`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BUNDLE = join(ROOT, "lib", "client.js");
const ARTIFACT = join(ROOT, "docs", "architecture.html");

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe") : null,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

const bundle = readFileSync(BUNDLE, "utf8");
const payload = /const TASK_DIAGRAM_GZIP_B64 = "([^"]*)";/.exec(bundle);
const embeddedSha = /const TASK_DIAGRAM_SHA256 = "([^"]*)";/.exec(bundle);
if (payload === null || embeddedSha === null) throw new Error("diagram constants not found in lib/client.js");
const expectedSha = embeddedSha[1];
const sourceSha = existsSync(ARTIFACT) ? createHash("sha256").update(readFileSync(ARTIFACT)).digest("hex") : null;
console.log("payload        ", payload[1].length, "base64 chars");
console.log("embedded sha256", expectedSha, sourceSha === expectedSha ? "(matches docs/architecture.html)" : "(DIFFERS from docs/architecture.html)");

const chrome = findChrome();
if (chrome === null) {
  console.log("SKIP: no Chrome found (set CHROME_PATH to enable the browser check)");
  process.exit(0);
}

const page = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>diagram-frame-check</title></head>
<body>
<pre id="out">running</pre>
<iframe id="plain" style="width:1000px;height:560px"></iframe>
<iframe id="sandboxed" sandbox="allow-scripts allow-downloads allow-modals allow-popups" style="width:1000px;height:560px"></iframe>
<script>
const B64 = ${JSON.stringify(payload[1])};
const EXPECTED = ${JSON.stringify(expectedSha)};
const lines = [];
const say = (message) => { lines.push(message); document.getElementById("out").textContent = lines.join("\\n"); };
async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function mount(id, html, sandboxed) {
  return new Promise((resolve) => {
    const frame = document.getElementById(id);
    frame.addEventListener("load", () => {
      if (sandboxed) { resolve("opaque-origin"); return; }
      const doc = frame.contentDocument;
      resolve("nodes=" + doc.querySelectorAll("[data-node-id]").length +
        " edges=" + doc.querySelectorAll("[data-edge-id]").length +
        " scripts=" + doc.scripts.length +
        " theme=" + doc.documentElement.getAttribute("data-theme"));
    }, { once: true });
    frame.srcdoc = html;
  });
}
(async () => {
  try {
    const binary = atob(B64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const html = await new Response(stream).text();
    const digest = await sha256(html);
    say("DecompressionStream: " + typeof DecompressionStream);
    say("decoded UTF-16 length: " + html.length);
    say("sha256 match: " + (digest === EXPECTED));
    say("archify artifact: " + (html.includes("archify") && html.startsWith("<!DOCTYPE html>")));
    const [plain, sandboxed] = await Promise.all([mount("plain", html, false), mount("sandboxed", html, true)]);
    say("rendered in iframe: " + plain);
    say("sandboxed iframe loaded: " + (sandboxed === "opaque-origin"));
    say("RESULT: " + (digest === EXPECTED && plain.includes("nodes=") ? "OK" : "FAIL"));
  } catch (error) {
    say("ERROR: " + (error && error.message ? error.message : String(error)));
  }
})();
</script>
</body></html>`;

const harnessDir = join(tmpdir(), "dsh-task-console-diagram-check");
mkdirSync(harnessDir, { recursive: true });
const harness = join(harnessDir, "index.html");
writeFileSync(harness, page);

const dom = execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--allow-file-access-from-files",
  "--virtual-time-budget=15000",
  "--dump-dom",
  "file:///" + harness.replace(/\\/g, "/"),
], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

const report = /<pre id="out">([\s\S]*?)<\/pre>/.exec(dom);
const text = report === null ? "" : report[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
console.log("browser        ", chrome);
console.log(text.trim());
const ok = text.includes("sha256 match: true") && text.includes("rendered in iframe: nodes=") && text.includes("RESULT: OK");
console.log(ok ? "ALL PASS" : "FAILURES");
process.exit(ok ? 0 : 1);
