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
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
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
/* the entry animation would scale the cards while the gesture runs; the layout math must
   be checked without that extra factor (the scaled-card case below adds its own) */
.dsh-tc-card{animation:none!important}
#zoomed{position:absolute;left:520px;top:520px;transform:scale(1.5);transform-origin:0 0}
</style></head>
<body>
<div class="dsh-tc-panel" data-theme="light" style="position:fixed;inset:0;transform:none">
  <div id="stage" class="dsh-tc-canvas" style="position:relative;width:100%;height:100%"></div>
  <div id="zoomed" class="dsh-tc-canvas" style="width:420px;height:420px"></div>
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
  const resizes = [];
  window.__resizes = resizes;
  // The harness owns the commit path so a grip drag can be observed end to end:
  // grip drag -> onBlockResize -> new block height -> re-render -> taller frame.
  const AppCard = (props) => {
    const [blocks, setBlocks] = React.useState(props.blocks);
    return jsx(tc.TaskCard, {
      id: props.id, title: props.title, layout: props.layout, zIndex: 10,
      boardRef: { current: document.getElementById(props.board) }, actions: [],
      onDragCommit() {}, onResizeCommit() {},
      children: jsx(tc.TaskUserBody, {
        card: { title: props.title, blocks }, cardId: props.id, onWidget() {}, onWidgetState() {},
        onBlockResize: (cardId, index, height) => {
          resizes.push({ cardId, index, height });
          const patched = tc.patchTaskEmbedHeight({ blocks }, index, height);
          if (patched !== null) setBlocks(patched.blocks);
        }
      })
    });
  };
  const url = "http://127.0.0.1:${PORT}/";
  const nodes = [
    jsx(AppCard, { id: "usr-a", title: "固定高度应用", board: "stage", blocks: [{ kind: "embed", url, title: "本地应用", height: 220, fill: false }], layout: { x: 40, y: 40, collapsed: false, w: 380, h: 460 } }, "a"),
    jsx(AppCard, { id: "usr-b", title: "铺满卡片的应用", board: "stage", blocks: [{ kind: "embed", url, title: "本地应用 · 铺满", fill: true }], layout: { x: 470, y: 40, collapsed: false, w: 460, h: 460 } }, "b"),
    jsx(AppCard, { id: "usr-c", title: "应用 + 控件", board: "stage", blocks: [
      { kind: "embed", url, title: "本地应用 · 混合", height: 200, fill: false },
      { kind: "note", text: "同一张卡片可以既有内嵌应用，也有说明与按钮。" },
      { kind: "button", action: "link", label: "在新标签打开", value: url }
    ], layout: { x: 40, y: 540, collapsed: false, w: 420, h: 320 } }, "c"),
    // Inside a scaled plane (like a zoomed infinite canvas), a screen-pixel drag has to
    // be converted back to layout pixels: 120 screen px at scale 1.5 -> 80 layout px.
    jsx(AppCard, { id: "usr-d", title: "缩放画布里的应用", board: "zoomed", blocks: [{ kind: "embed", url, title: "本地应用 · 缩放", height: 200, fill: false }], layout: { x: 10, y: 10, collapsed: false, w: 260, h: 300 } }, "d")
  ];
  const roots = new Map();
  const rootFor = (board) => {
    if (!roots.has(board)) roots.set(board, ReactDOM.createRoot(document.getElementById(board)));
    return roots.get(board);
  };
  ReactDOM.flushSync(() => {
    rootFor("stage").render(jsx(React.Fragment, { children: nodes.filter((node) => node.key !== "d") }));
    // A second board, so both trees can be rendered with flushSync deterministically.
    ReactDOM.flushSync(() => rootFor("zoomed").render(jsx(React.Fragment, { children: nodes.filter((node) => node.key === "d") })));
  });
  // Replay the real gesture on the grip: pointerdown, window pointermove, pointerup.
  const drag = (grip, deltaY) => {
    const box = grip.getBoundingClientRect();
    const startY = box.top + box.height / 2;
    const pointer = (type, clientY) => new PointerEvent(type, {
      bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 1, pointerType: "mouse",
      clientX: box.left + 10, clientY,
    });
    grip.dispatchEvent(pointer("pointerdown", startY));
    for (let step = 1; step <= 6; step++) window.dispatchEvent(pointer("pointermove", startY + (deltaY * step) / 6));
    window.dispatchEvent(pointer("pointerup", startY + deltaY));
  };
  // Everything below runs synchronously: the report must not depend on timers or
  // rAF, which headless virtual time does not always deliver before the DOM dump.
  const cardOf = (title) => [...document.querySelectorAll(".dsh-tc-card")].find((node) => (node.textContent || "").includes(title));
  const fixedCard = cardOf("固定高度应用");
  // Layout height (offsetHeight) on purpose: the card is still running its entry
  // animation, so the painted rect is scaled — the gesture must use layout pixels.
  const heightOf = (node) => (node === null || node === undefined ? -1 : node.offsetHeight);
  const fixedFrame = () => (fixedCard === undefined ? null : fixedCard.querySelector(".dsh-tc-appFrame"));
  const fixedWrap = () => (fixedCard === undefined ? null : fixedCard.querySelector(".dsh-tc-appWrap"));
  const before = heightOf(fixedWrap());
  const beforeFrame = heightOf(fixedFrame());
  const grip = fixedCard === undefined ? null : fixedCard.querySelector(".dsh-tc-appGrip");
  if (grip !== null && grip !== undefined) drag(grip, 140);
  ReactDOM.flushSync(() => {});
  const apps = document.querySelectorAll(".dsh-tc-app").length;
  const frames = document.querySelectorAll(".dsh-tc-appFrame").length;
  const fills = document.querySelectorAll(".dsh-tc-appFill").length;
  const grips = document.querySelectorAll(".dsh-tc-appGrip").length;
  const after = heightOf(fixedWrap());
  const afterFrame = heightOf(fixedFrame());
  const sandboxes = [...document.querySelectorAll(".dsh-tc-appFrame")].map((frame) => frame.getAttribute("sandbox") || "");
  log("RESULT apps=" + apps + " frames=" + frames + " fill=" + fills + " grips=" + grips +
    " sandboxed=" + sandboxes.every((value) => value.includes("allow-scripts") && !value.includes("allow-top-navigation")));
  log("DRAG wrapBefore=" + before + " wrapAfter=" + after +
    " frameBefore=" + beforeFrame + " frameAfter=" + afterFrame +
    " committed=" + JSON.stringify(resizes));
  // Same gesture inside the 1.5x plane: 120 screen px must become 80 layout px.
  const zoomedCard = [...document.querySelectorAll("#zoomed .dsh-tc-card")][0];
  const zoomedWrap = () => (zoomedCard === undefined ? null : zoomedCard.querySelector(".dsh-tc-appWrap"));
  const zoomedGrip = zoomedCard === undefined ? undefined : zoomedCard.querySelector(".dsh-tc-appGrip");
  const zoomedBefore = heightOf(zoomedWrap());
  const rectBefore = zoomedWrap() === null ? -1 : Math.round(zoomedWrap().getBoundingClientRect().height);
  if (zoomedGrip !== undefined && zoomedGrip !== null) drag(zoomedGrip, 120);
  ReactDOM.flushSync(() => {});
  const zoomedAfter = heightOf(zoomedWrap());
  const rectAfter = zoomedWrap() === null ? -1 : Math.round(zoomedWrap().getBoundingClientRect().height);
  log("ZOOMED scale=" + (zoomedBefore > 0 ? (rectBefore / zoomedBefore).toFixed(2) : "n/a") +
    " layoutBefore=" + zoomedBefore + " layoutAfter=" + zoomedAfter +
    " rectAfter=" + rectAfter + " committed=" + JSON.stringify(resizes[resizes.length - 1]));
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
// One invocation both screenshots the page and dumps its DOM — two back-to-back
// instances race and the second one can come back empty.
const runChrome = (args) => new Promise((resolve) => {
  const profile = join(OUT, "chrome-profile");
  // A fresh profile per run: a reused one can serve the previously loaded
  // bundle from its cache, which would verify the old client.js.
  rmSync(profile, { recursive: true, force: true });
  const child = spawn(chrome, [...args, "--user-data-dir=" + profile], { stdio: ["ignore", "pipe", "ignore"] });
  let out = "";
  child.stdout.on("data", (chunk) => { out += chunk; });
  child.on("exit", () => resolve(out));
});
const url = "file:///" + harness.replace(/\\/g, "/");
const dom = await runChrome([
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox", "--hide-scrollbars",
  "--allow-file-access-from-files", "--virtual-time-budget=9000", "--window-size=1000,900",
  "--screenshot=" + shot, "--dump-dom", url,
]);
server.close();

const report = /<pre id="log"[^>]*>([\s\S]*?)<\/pre>/.exec(dom);
if (process.env.DSH_EMBED_DEBUG === "1") writeFileSync(join(OUT, "dom-dump.html"), dom);
const text = report === null ? "" : report[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
console.log("browser   ", chrome);
console.log("screenshot", shot);
console.log("dom bytes ", dom.length);
console.log(text === "" ? "no page report" : text);
const sizes = /DRAG wrapBefore=(\d+) wrapAfter=(\d+) frameBefore=(\d+) frameAfter=(\d+) committed=(\[.*\])/.exec(text);
const zoom = /ZOOMED scale=([\d.]+) layoutBefore=(\d+) layoutAfter=(\d+) rectAfter=(-?\d+) committed=(\{.*\})/.exec(text);
const committed = sizes === null ? [] : JSON.parse(sizes[5]);
const wrapBefore = sizes === null ? -1 : Number(sizes[1]);
const wrapAfter = sizes === null ? -1 : Number(sizes[2]);
const frameAfter = sizes === null ? -1 : Number(sizes[4]);
const zoomScale = zoom === null ? -1 : Number(zoom[1]);
const zoomBefore = zoom === null ? -1 : Number(zoom[2]);
const zoomAfter = zoom === null ? -1 : Number(zoom[3]);
const zoomCommitted = zoom === null ? {} : JSON.parse(zoom[5]);
const ok = text.includes("apps=4") &&
  text.includes("frames=4") &&
  text.includes("fill=1") &&
  text.includes("grips=3") &&
  text.includes("sandboxed=true") &&
  // grip drag on the board: the app grew by the dragged distance and committed once
  wrapBefore === 220 &&
  wrapAfter === wrapBefore + 140 &&
  frameAfter === wrapAfter &&
  committed.length === 1 &&
  committed[0].cardId === "usr-a" &&
  committed[0].index === 0 &&
  committed[0].height === wrapAfter &&
  // grip drag inside a 1.5x plane: screen px are converted back to layout px
  Math.abs(zoomScale - 1.5) <= 0.02 &&
  zoomBefore === 200 &&
  Math.abs(zoomAfter - (zoomBefore + Math.round(120 / zoomScale))) <= 1 &&
  zoomCommitted.cardId === "usr-d" &&
  zoomCommitted.height === zoomAfter;
console.log(ok ? "ALL PASS" : "FAILURES");
process.exit(ok ? 0 : 1);
