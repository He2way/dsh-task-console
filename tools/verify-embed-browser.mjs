// Verify embedded web apps on cards in a real browser.
//
// Starts a tiny local HTTP app, mounts the plugin's real card components in
// headless Chromium and screenshots the result, so the whole chain is covered:
// declarative `embed` block -> sandboxed iframe -> app scripts running -> the
// `fill` layout stretching inside a resized card.
//
//   npm run verify:embed
//
// Needs Chrome and the react/react-dom devDependencies (their UMD builds);
// otherwise the check is skipped (exit 0) so it never blocks `npm test`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = join(tmpdir(), "dsh-task-console-embed-check");
const PORT = 5199;

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

const chrome = findChrome();
const reactUmd = join(ROOT, "node_modules", "react", "umd", "react.development.js");
const reactDomUmd = join(ROOT, "node_modules", "react-dom", "umd", "react-dom.development.js");
const missing = [chrome === null ? "Chrome (set CHROME_PATH)" : null, existsSync(reactUmd) && existsSync(reactDomUmd) ? null : "react/react-dom UMD builds (npm i)"].filter(Boolean);
if (missing.length > 0) {
  console.log("SKIP: missing " + missing.join(", "));
  process.exit(0);
}

// The embedded app only reports success if its own scripts really run in the sandbox.
const appHtml = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>本地应用</title>
<style>body{margin:0;font:13px/1.5 system-ui,sans-serif;background:linear-gradient(150deg,#0f766e,#0ea5e9);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:6px}
h1{margin:0;font-size:20px}button{font:inherit;padding:6px 12px;border-radius:8px;border:0;background:#fff;color:#0f766e;cursor:pointer}</style></head>
<body><h1>LOCAL APP OK</h1><div id="state">脚本未运行</div><button id="b">点我</button>
<script>
let clicks = 0;
const render = () => { document.getElementById("state").textContent = "沙箱内脚本已运行 · 点击 " + clicks + " 次"; };
document.getElementById("b").addEventListener("click", () => { clicks += 1; render(); });
render();
<\/script></body></html>`;

const server = createServer((request, response) => {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  response.end(appHtml);
});
await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

const page = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>embed check</title>
<style>
:root{--dsw-alias-label-primary:#0f172a;--dsw-alias-label-secondary:#475569;--dsw-alias-label-tertiary:#8a94a6;
--dsw-alias-state-business-primary:#3b82f6;--dsw-alias-bg-primary:#ffffff;--dsw-alias-border-secondary:rgba(148,163,184,.4)}
html,body{margin:0;height:100%;background:#eef2ff;font:13px/1.5 system-ui,"Segoe UI",sans-serif;color:#0f172a}
</style></head>
<body>
<div class="dsh-tc-panel" data-theme="light" style="position:fixed;inset:0;transform:none">
  <div id="stage" class="dsh-tc-canvas" style="position:relative;width:100%;height:100%"></div>
</div>
<pre id="log" style="position:fixed;left:8px;bottom:8px;margin:0;font-size:11px;color:#334155"></pre>
<script src="file:///${reactUmd.replace(/\\/g, "/")}"></script>
<script src="file:///${reactDomUmd.replace(/\\/g, "/")}"></script>
<script>window.__ModuleLoader__ = { load(entry) { window.__factory = entry.factory; } };</script>
<script src="file:///${join(ROOT, "lib", "client.js").replace(/\\/g, "/")}"></script>
<script>
const log = (message) => { document.getElementById("log").textContent += message + "\\n"; };
const jsx = function (type, props) {
  const config = Object.assign({}, props || {});
  const key = arguments.length > 2 ? arguments[2] : undefined;
  const children = config.children;
  delete config.children;
  if (key !== undefined) config.key = key;
  const kids = children === undefined ? [] : Array.isArray(children) ? children : [children];
  return React.createElement(type, config, ...kids);
};
const requireShim = (spec) => {
  if (spec === "react") return React;
  if (spec === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: React.Fragment };
  if (spec === "react-dom") return { createPortal: ReactDOM.createPortal };
  throw new Error("unexpected require " + spec);
};
try {
  const tc = window.__factory(requireShim).__dshTestHooks;
  const boardRef = { current: document.getElementById("stage") };
  const card = (id, title, blocks, layout) => jsx(tc.TaskCard, {
    id, title, layout, zIndex: 10, boardRef, actions: [],
    onDragCommit() {}, onResizeCommit() {},
    children: jsx(tc.TaskUserBody, { card: { title, blocks }, cardId: id, onWidget() {}, onWidgetState() {} })
  });
  const url = "http://127.0.0.1:${PORT}/";
  const nodes = [
    card("usr-a", "固定高度应用", [{ kind: "embed", url, title: "本地应用", height: 320, fill: false }], { x: 40, y: 40, collapsed: false, w: 380, h: 460 }),
    card("usr-b", "铺满卡片的应用", [{ kind: "embed", url, title: "本地应用 · 铺满", fill: true }], { x: 470, y: 40, collapsed: false, w: 460, h: 460 }),
    card("usr-c", "应用 + 控件", [
      { kind: "embed", url, title: "本地应用 · 混合", height: 200, fill: false },
      { kind: "note", text: "同一张卡片可以既有内嵌应用，也有说明与按钮。" },
      { kind: "button", action: "link", label: "在新标签打开", value: url }
    ], { x: 40, y: 540, collapsed: false, w: 420, h: 320 })
  ];
  ReactDOM.createRoot(document.getElementById("stage")).render(jsx(React.Fragment, { children: nodes }));
  setTimeout(() => {
    const apps = document.querySelectorAll(".dsh-tc-app").length;
    const frames = document.querySelectorAll(".dsh-tc-appFrame").length;
    const fills = document.querySelectorAll(".dsh-tc-appFill").length;
    const sandboxes = [...document.querySelectorAll(".dsh-tc-appFrame")].map((frame) => frame.getAttribute("sandbox") || "");
    log("RESULT apps=" + apps + " frames=" + frames + " fill=" + fills +
      " sandboxed=" + sandboxes.every((value) => value.includes("allow-scripts") && !value.includes("allow-top-navigation")));
  }, 2000);
} catch (error) {
  log("ERROR " + (error && error.message ? error.message : String(error)));
}
<\/script>
</body></html>`;

mkdirSync(OUT, { recursive: true });
const harness = join(OUT, "index.html");
writeFileSync(harness, page);
const shot = join(OUT, "card-embed.png");

// Chrome runs asynchronously on purpose: execFileSync would block this process'
// event loop, so the local app server could never answer the iframe requests.
// Each run gets its own profile dir, otherwise a second instance would attach to
// the first one's profile and print nothing.
let runIndex = 0;
const runChrome = (args, capture) => new Promise((resolve) => {
  runIndex += 1;
  const profile = join(OUT, "chrome-profile-" + (capture ? "dom" : "shot"));
  const child = spawn(chrome, [...args, "--user-data-dir=" + profile], {
    stdio: ["ignore", capture ? "pipe" : "ignore", "ignore"],
  });
  let out = "";
  if (capture) child.stdout.on("data", (chunk) => { out += chunk; });
  child.on("exit", () => resolve(out));
});
const url = "file:///" + harness.replace(/\\/g, "/");
await runChrome([
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox", "--hide-scrollbars",
  "--allow-file-access-from-files", "--virtual-time-budget=9000", "--window-size=1000,900",
  "--screenshot=" + shot, url,
], false);
const dom = await runChrome([
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox",
  "--allow-file-access-from-files", "--virtual-time-budget=9000", "--dump-dom", url,
], true);
server.close();

const report = /<pre id="log"[^>]*>([\s\S]*?)<\/pre>/.exec(dom);
const text = report === null ? "" : report[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
console.log("browser   ", chrome);
console.log("screenshot", shot);
console.log(text === "" ? "no page report" : text);
const ok = text.includes("apps=3") && text.includes("frames=3") && text.includes("fill=1") && text.includes("sandboxed=true");
console.log(ok ? "ALL PASS" : "FAILURES");
process.exit(ok ? 0 : 1);
