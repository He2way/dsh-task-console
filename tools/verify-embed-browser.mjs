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
import { startBridge } from "../bridge/server.mjs";
import { buildCubeGlb } from "./cube-glb.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = join(tmpdir(), "dsh-task-console-embed-check");
const PORT = 5199;
const BRIDGE_PORT = 8790;

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

// A stand-in for a real DSH client plugin. It publishes the embed global the convention
// prescribes (`__DSH_<ID WITHOUT dsh-plugin->__`) and `mountEmbedded(host, api)`, and stamps
// every load and mount so a *rebuild* (re-materialized bundle → remount) is unmistakable.
const demoPluginJs = `(function () {
  var built = 0;
  globalThis.__DSH_DEMO_LOADS__ = (globalThis.__DSH_DEMO_LOADS__ || 0) + 1;
  var load = globalThis.__DSH_DEMO_LOADS__;
  globalThis.__DSH_DEMO__ = {
    mountEmbedded: function (host, api) {
      built += 1;
      var stamp = "load-" + load + "-build-" + built;
      var text = "PLUGIN OK " + stamp + " · id=" + (api && api.status ? api.status.id : "?");
      if (globalThis.React !== void 0 && api && typeof api.render === "function") {
        api.render(React.createElement("div", { className: "demoPluginBody", "data-build": stamp }, text));
      } else {
        var node = document.createElement("div");
        node.className = "demoPluginBody";
        node.setAttribute("data-build", stamp);
        node.textContent = text;
        host.appendChild(node);
      }
      if (api && typeof api.onStatus === "function") api.onStatus({ message: "已挂载 " + stamp });
    }
  };
})();`;

// The model the 3D-viewer stage puts on the canvas: a real, valid glTF-binary cube.
const cubeBase64 = buildCubeGlb().toString("base64");

const server = createServer((request, response) => {
  const path = String(request.url === void 0 ? "/" : request.url).split("?")[0];
  // The page is file://, so it needs CORS to read the pixel it turns into a local image control.
  const headers = { "cache-control": "no-store", "access-control-allow-origin": "*" };
  if (path === "/pixel.png") {
    response.writeHead(200, { ...headers, "content-type": "image/png" });
    response.end(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAJUlEQVR42u3NMQEAAAgDoC251a3gLzSgmXBPFEVRFEVRFEVRFEXxW3wXTQGx6hK8AAAAAElFTkSuQmCC", "base64"));
    return;
  }
  if (path === "/demo-plugin.js") {
    response.writeHead(200, { ...headers, "content-type": "text/javascript; charset=utf-8" });
    response.end(demoPluginJs);
    return;
  }
  response.writeHead(200, { ...headers, "content-type": "text/html; charset=utf-8" });
  response.end(appHtml);
});
await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

// The page bridge: proxies the app above and injects the agent the workbench drives.
const bridge = startBridge({ port: BRIDGE_PORT, host: "127.0.0.1" });
await bridge.ready;
const bridgePort = bridge.server.address().port;
console.log("page bridge on http://127.0.0.1:" + bridgePort);

const pageHead = (title, extraCss) => `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>${title}</title>
<style>
:root{--dsw-alias-label-primary:#0f172a;--dsw-alias-label-secondary:#475569;--dsw-alias-label-tertiary:#8a94a6;
--dsw-alias-state-business-primary:#3b82f6;--dsw-alias-bg-primary:#ffffff;--dsw-alias-border-secondary:rgba(148,163,184,.4)}
html,body{margin:0;height:100%;background:#eef2ff;font:13px/1.5 system-ui,"Segoe UI",sans-serif;color:#0f172a}
/* the entry animation would scale the cards while the gesture runs; the layout math must
   be checked without that extra factor (the scaled-card case below adds its own) */
.dsh-tc-card{animation:none!important}
${extraCss}
</style></head>
<body>`;

const pageTail = `</body></html>`;

const pageScripts = `<pre id="log" style="position:fixed;left:8px;bottom:8px;margin:0;font-size:11px;color:#334155;z-index:2147483700"></pre>
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
  if (spec === "react-dom") return { createPortal: ReactDOM.createPortal, createRoot: ReactDOM.createRoot, flushSync: ReactDOM.flushSync };
  throw new Error("unexpected require " + spec);
};
<\/script>
`;

const page = pageHead("embed check", `#zoomed{position:absolute;left:520px;top:520px;transform:scale(1.5);transform-origin:0 0}`) + `
<div class="dsh-tc-panel" data-theme="light" style="position:fixed;inset:0;transform:none">
  <div id="stage" class="dsh-tc-canvas" style="position:relative;width:100%;height:100%"></div>
  <div id="zoomed" class="dsh-tc-canvas" style="width:420px;height:420px"></div>
</div>
` + pageScripts + `<script>
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

// ---- phase 2: the real task board, with a card opened fullscreen ----
// The panel is normally un-rotated by the flip container's [data-settled] rule; the
// harness has no flip wrapper, so it neutralises the back-face transform itself.
const boardPage = pageHead("fullscreen check", `.dsh-tc-panel{transform:none!important;backface-visibility:visible!important}
/* entry animations would offset geometry while the checks measure it */
.dsh-tc-canvasChat,.dsh-tc-fullCard,.dsh-tc-bare{animation:none!important}`) + `
<div class="dsh-tc-panel" data-theme="light" style="position:fixed;inset:0;transform:none">
  <div id="board" class="dsh-tc-canvas" style="position:relative;width:100%;height:100%"></div>
</div>
` + pageScripts + `<script>
try {
  const tc = window.__factory(requireShim).__dshTestHooks;
  const STATE = {
    current: "s1",
    byId: { s1: { id: "s1", displayTitle: "测试会话", running: true, cwd: "D:/demo", updatedAt: Date.now() - 4000, origin: "root" } },
    jobsBySession: { s1: [] },
    subagentsByParent: { s1: { entries: [] } },
    phase: "ready"
  };
  const useSessions = (selector) => selector(STATE);
  const url = "http://127.0.0.1:${PORT}/";
  // A boot manifest with one hosting-capable plugin: the canvas' 🧩 picker and the
  // addPlugin op both resolve their client bundle through it.
  const demoPluginId = "dsh-plugin-demo";
  globalThis.__DSH_BOOT__ = { entries: [{ id: demoPluginId, url: "http://127.0.0.1:${PORT}/demo-plugin.js" }] };
  // Anything that throws inside an event handler would otherwise be invisible to this harness.
  const pageErrors = [];
  window.addEventListener("error", (event) => pageErrors.push(String(event.message)));
  window.addEventListener("unhandledrejection", (event) => pageErrors.push("rejection: " + String(event.reason)));
  // Create the card in the store before mounting the panel: the panel reads the store in
  // its state initializer, so no extra render tick is needed here. Three controls so the
  // explosion (one canvas item per control) and the drag-reordering can be observed.
  const applied = tc.applyTaskCardSpec({
    op: "upsert",
    title: "全屏应用卡",
    blocks: [
      { kind: "heading", text: "发版前" },
      { kind: "checklist", key: "todo", items: [{ id: "a", label: "跑测试" }, { id: "b", label: "更新文档" }] },
      { kind: "embed", url, title: "本地应用 · 全屏", fill: true }
    ]
  });
  ReactDOM.flushSync(() => {
    ReactDOM.createRoot(document.getElementById("board")).render(jsx(tc.TaskBackPanel, { useSessions, onClose: () => {}, plugins: undefined }));
  });
  ReactDOM.flushSync(() => {});
  const cards = document.querySelectorAll(".dsh-tc-card");
  const titles = [...cards].map((node) => (node.querySelector(".dsh-tc-cardTitle") || {}).textContent || "?");
  const cardOf = (text) => [...document.querySelectorAll(".dsh-tc-card")].find((node) => (node.textContent || "").indexOf(text) !== -1);
  const buttonOf = (card, prefix) => (card === undefined ? null : [...card.querySelectorAll(".dsh-tc-cardIconBtn")].find((node) => (node.getAttribute("title") || "").indexOf(prefix) === 0) ?? null);
  const appCardNode = cardOf("全屏应用卡");
  log("BOARD cards=" + cards.length + " applied=" + JSON.stringify(applied) + " titles=" + titles.join("|"));

  // ---- maximize a user card: its controls unroll onto its own canvas ("副本") ----
  const blockKindsOf = (card) => (card === undefined ? "?" : [...card.querySelectorAll(".dsh-tc-blocks > *")].map((node) => node.className.replace(/dsh-tc-|\\s.*/g, "")).join("|"));
  const orderBefore = blockKindsOf(appCardNode);
  const maximize = buttonOf(appCardNode, "最大化");
  if (maximize !== null) maximize.click();
  ReactDOM.flushSync(() => {});
  const view = document.querySelector(".dsh-tc-canvasView");
  const barTitle = document.querySelector(".dsh-tc-canvasBarTitle");
  const barText = view === null ? "" : view.querySelector(".dsh-tc-canvasBar").textContent;
  const planeItems = [...document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-card")];
  const planeApps = document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-app").length;
  const bound = tc.canvasSnapshot().canvases[tc.canvasInstanceId(applied.id)];
  const boundItems = bound === undefined ? [] : Object.values(bound.cards).filter((item) => tc.canvasCardBinding(item) !== null);
  log("INSTANCE view=" + (view !== null) +
    " title=" + (barTitle === null ? "none" : barTitle.textContent) +
    " items=" + planeItems.length + " apps=" + planeApps +
    " bound=" + boundItems.length +
    " oneControlEach=" + boundItems.every((item) => item.blocks.length === 1) +
    " sourceCopy=" + (barText.indexOf("放入源卡副本") !== -1) +
    " rebuild=" + (barText.indexOf("重新展开控件") !== -1) +
    " backToBoard=" + (barText.indexOf("返回任务台") !== -1) +
    " hasNewCanvas=" + (barText.indexOf("新画布") !== -1));

  // ---- drag a control on the plane: the card's control order follows it ----
  const firstItem = planeItems[0];
  const itemHeader = firstItem === undefined ? null : firstItem.querySelector(".dsh-tc-cardHead");
  if (itemHeader !== null && itemHeader !== undefined) {
    const box = itemHeader.getBoundingClientRect();
    const pointer = (type, clientY) => new PointerEvent(type, {
      bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 7, pointerType: "mouse",
      clientX: box.left + 24, clientY
    });
    itemHeader.dispatchEvent(pointer("pointerdown", box.top + 8));
    itemHeader.dispatchEvent(pointer("pointermove", box.top + 8 + 640));
    itemHeader.dispatchEvent(pointer("pointerup", box.top + 8 + 640));
  }
  ReactDOM.flushSync(() => {});
  const orderAfter = blockKindsOf(appCardNode);
  log("REORDER before=" + orderBefore + " after=" + orderAfter);

  // ---- a conversation refactor must reach the plane as well ----
  const instanceKey = tc.canvasInstanceId(applied.id);
  const boundInPage = () => Object.values(tc.canvasSnapshot().canvases[instanceKey].cards).filter((item) => tc.canvasCardBinding(item) !== null);
  const headingItem = boundInPage().find((item) => item.blocks[0].kind === "heading");
  const embedItem = boundInPage().find((item) => item.blocks[0].kind === "embed");
  const refactor = tc.applyTaskCardSpec({
    op: "upsert",
    id: applied.id,
    title: "全屏应用卡",
    blocks: [
      { ...headingItem.blocks[0], bid: headingItem.from.bid, text: "重构后的标题" },
      embedItem.blocks[0],
      { kind: "note", text: "重构新增的说明" },
    ],
  });
  ReactDOM.flushSync(() => {});
  const afterRefactor = boundInPage();
  const keptItem = afterRefactor.find((item) => item.id === headingItem.id);
  log("REFACTOR ok=" + refactor.ok +
    " items=" + afterRefactor.length +
    " kept=" + (keptItem !== void 0 && keptItem.blocks[0].text === "重构后的标题") +
    " place=" + (keptItem !== void 0 && keptItem.x === headingItem.x && keptItem.y === headingItem.y) +
    " domItems=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-card").length +
    " titles=" + afterRefactor.map((item) => item.title).sort().join("/"));

  // ---- add any control straight onto the plane (no card around it) ----
  const addButton = [...document.querySelectorAll(".dsh-tc-canvasBar .dsh-tc-btn")].find((node) => (node.textContent || "").indexOf("+ 控件") === 0) ?? null;
  if (addButton !== null) addButton.click();
  ReactDOM.flushSync(() => {});
  const chips = [...document.querySelectorAll(".dsh-tc-addChip")];
  const counterChip = chips.find((node) => (node.textContent || "") === "计数") ?? null;
  if (counterChip !== null) counterChip.click();
  ReactDOM.flushSync(() => {});
  const bareItems = [...document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare")];
  const counterItem = bareItems[bareItems.length - 1] ?? null;
  const counterCard = counterItem === null ? null : tc.canvasSnapshot().canvases[instanceKey].cards[counterItem.getAttribute("data-id") || ""];
  log("ADD menu=" + (addButton !== null) + " chips=" + chips.length +
    " bare=" + bareItems.length +
    " kind=" + (counterItem === null ? "none" : counterItem.getAttribute("data-kind")) +
    " noCardChrome=" + (counterItem !== null && counterItem.querySelector(".dsh-tc-cardHead") === null) +
    " hasCounter=" + (counterItem !== null && counterItem.querySelector(".dsh-tc-count") !== null));

  // dragging a bare control by its toolbar moves it on the plane
  const beforeBareMove = counterItem === null ? null : { left: counterItem.style.left, top: counterItem.style.top };
  const bareGrip = counterItem === null ? null : counterItem.querySelector(".dsh-tc-bareTools");
  if (bareGrip !== null && bareGrip !== undefined && counterItem !== null) {
    const box = bareGrip.getBoundingClientRect();
    const pointer = (type, clientX, clientY) => new PointerEvent(type, {
      bubbles: true, cancelable: true, button: 0, buttons: 1, pointerId: 9, pointerType: "mouse", clientX, clientY
    });
    bareGrip.dispatchEvent(pointer("pointerdown", box.left + 10, box.top + 8));
    bareGrip.dispatchEvent(pointer("pointermove", box.left + 130, box.top + 68));
    bareGrip.dispatchEvent(pointer("pointerup", box.left + 130, box.top + 68));
  }
  ReactDOM.flushSync(() => {});
  log("BAREDRAG before=" + JSON.stringify(beforeBareMove) + " after=" + JSON.stringify(counterItem === null ? null : { left: counterItem.style.left, top: counterItem.style.top }));

  // ---- the canvas' own chat dock + a [canvas] op list applied to the plane ----
  // Stores are published outside React here, exactly like the dock's agent reply does:
  // the update is scheduled and a later frame renders it, so this step waits a beat.
  Promise.resolve().then(() => {
    const chatInput = document.querySelector(".dsh-tc-canvasChatInput");
    const chatSend = document.querySelector(".dsh-tc-canvasChat .dsh-tc-btnPrimary");
    const beforeChat = document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare").length;
    const chatApplied = tc.applyCanvasSpec(instanceKey, {
      ops: [
        { op: "add", block: { kind: "countdown", label: "截止", until: Date.now() + 3600000, bid: "blk-chat" }, x: 40, y: 420 },
        { op: "rename", name: "对话改名的副本" },
        { op: "note", note: "已加上倒计时" },
      ],
    });
    ReactDOM.flushSync(() => {});
    return new Promise((resolve) => setTimeout(resolve, 80)).then(() => {
      ReactDOM.flushSync(() => {});
      const dock = document.querySelector(".dsh-tc-canvasChat");
      const dockBox = dock === null ? null : dock.getBoundingClientRect();
      const view = document.querySelector(".dsh-tc-canvasView");
      const viewBox = view === null ? null : view.getBoundingClientRect();
      const centerOffset = dockBox === null || viewBox === null ? -1 : Math.round((dockBox.left + dockBox.width / 2) - (viewBox.left + viewBox.width / 2));
      log("CHAT input=" + (chatInput !== null) + " send=" + (chatSend !== null) +
        " placeholder=" + (chatInput === null ? "none" : (chatInput.getAttribute("placeholder") || "")) +
        " dockW=" + (dockBox === null ? -1 : Math.round(dockBox.width)) +
        " centerOffset=" + centerOffset +
        " gapBottom=" + (dockBox === null || viewBox === null ? -1 : Math.round(viewBox.bottom - dockBox.bottom)) +
        " floating=" + (dockBox !== null && viewBox !== null && dockBox.width < viewBox.width * 0.5) +
        " bareBefore=" + beforeChat +
        " bareAfter=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare").length +
        " changed=" + chatApplied.changed +
        " storeName=" + tc.canvasSnapshot().canvases[instanceKey].name +
        " storeCards=" + Object.keys(tc.canvasSnapshot().canvases[instanceKey].cards).length +
        " domName=" + (document.querySelector(".dsh-tc-canvasName") === null ? "none" : document.querySelector(".dsh-tc-canvasName").value) +
        " note=" + JSON.stringify(chatApplied.notes));
    });
  });

  // ---- fullscreen overlay from the control item that holds the embedded app ----
  const canvasCard = [...document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-card")].find((node) => node.querySelector(".dsh-tc-app") !== null) ?? null;
  const fullButton = canvasCard === null ? null : buttonOf(canvasCard, "全屏显示");
  if (fullButton !== null) fullButton.click();
  ReactDOM.flushSync(() => {});
  const overlay = document.querySelector(".dsh-tc-full");
  const shell = document.querySelector(".dsh-tc-fullCard");
  const frame = document.querySelector(".dsh-tc-full .dsh-tc-appFrame");
  const appBody = document.querySelector(".dsh-tc-full .dsh-tc-app");
  log("FULL overlay=" + (overlay !== null) +
    " shell=" + (shell === null ? -1 : shell.offsetHeight) +
    " app=" + (appBody === null ? -1 : appBody.offsetHeight) +
    " frame=" + (frame === null ? -1 : frame.offsetHeight) +
    " appFill=" + (document.querySelector(".dsh-tc-full .dsh-tc-appFill") !== null) +
    " viewport=" + window.innerWidth + "x" + window.innerHeight +
    " hint=" + (document.querySelector(".dsh-tc-fullHint") === null ? "none" : document.querySelector(".dsh-tc-fullHint").textContent));
  // Esc closes the overlay only — the instance canvas stays open underneath. The extra
  // flush lets React run the canvas' passive effect so its Escape guard sees fullId.
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ReactDOM.flushSync(() => {});
  ReactDOM.flushSync(() => {});
  log("ESCAPE overlay=" + (document.querySelector(".dsh-tc-full") === null) + " instance=" + (document.querySelector(".dsh-tc-canvasView") !== null));

  // ---- derive a variant inside the instance and leave it open for the screenshot ----
  const planeCard = document.querySelector(".dsh-tc-canvasPlane .dsh-tc-card");
  const duplicate = planeCard === null ? null : buttonOf(planeCard, "复制这张卡片");
  if (duplicate !== null) duplicate.click();
  ReactDOM.flushSync(() => {});
  log("DERIVE items=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-card").length +
    " bare=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare").length +
    " apps=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-app").length);

  // ---- host another plugin's UI on the canvas: 🧩 picker, then [canvas] ops ----
  // The plugin is not a card kind: its client bundle is materialized from the boot manifest,
  // its embed entry mounts into each item (one load, many mounts), and the rebuild op
  // materializes the bundle again — the load/build stamps below prove both.
  const waitFor = (check, budget) => new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      let ok = false;
      try { ok = check() === true; } catch { ok = false; }
      if (ok === true || Date.now() - started > budget) resolve(ok === true);
      else setTimeout(tick, 50);
    };
    tick();
  });
  const pluginState = () => { ReactDOM.flushSync(() => {}); return tc.taskPluginState(demoPluginId).state; };
  const pluginBodies = () => [...document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-pluginHost .dsh-tc-pluginNode")];
  const stampOf = (node) => {
    const found = /load-\\d+-build-\\d+/.exec(node === null || node === void 0 ? "" : String(node.textContent));
    return found === null ? "none" : found[0];
  };
  const pluginPhase = Promise.resolve().then(() => {
    const picker = [...document.querySelectorAll(".dsh-tc-canvasBar .dsh-tc-btn")].find((node) => (node.textContent || "").indexOf("🧩") === 0) ?? null;
    if (picker !== null) picker.click();
    ReactDOM.flushSync(() => {});
    const panel = [...document.querySelectorAll(".dsh-tc-addPanel")].find((node) => (node.textContent || "").indexOf("点一个插件") !== -1) ?? null;
    const chips = panel === null ? [] : [...panel.querySelectorAll(".dsh-tc-addChip")];
    const chip = chips.find((node) => (node.getAttribute("title") || "").indexOf(demoPluginId) === 0) ?? null;
    if (chip !== null) chip.click();
    ReactDOM.flushSync(() => {});
    return waitFor(() => pluginState() === "mounted", 8000).then((mounted) => {
      const first = pluginBodies()[0] ?? null;
      const firstStamp = stampOf(first);
      const found = tc.findPluginEntry(demoPluginId, void 0);
      log("PLUGIN picker=" + (picker !== null) + " panel=" + (panel !== null) + " chips=" + chips.length +
        " chip=" + (chip !== null) +
        " state=" + pluginState() +
        " mounted=" + mounted +
        " entry=" + JSON.stringify(found === null ? "none" : found.name) +
        " stamp=" + firstStamp +
        " text=" + JSON.stringify(String(first === null ? "" : first.textContent).slice(0, 80)) +
        " status=" + JSON.stringify(tc.taskPluginState(demoPluginId).message));
      // The same feature through the protocol a conversation writes: one op adds a second
      // plugin item, one op rebuilds the item the picker created (fresh revision → remount).
      const hosted = Object.values(tc.canvasSnapshot().canvases[instanceKey].cards).find((item) => item.plugin !== void 0);
      const spec = tc.applyCanvasSpec(instanceKey, {
        ops: [
          { op: "addPlugin", id: demoPluginId, title: "协议加的插件", height: 300 },
          { op: "rebuild", id: hosted === void 0 ? "cc-missing" : hosted.id }
        ]
      });
      ReactDOM.flushSync(() => {});
      return waitFor(() => pluginBodies().length >= 2 &&
        stampOf(pluginBodies()[0]) !== "none" &&
        stampOf(pluginBodies()[0]) !== firstStamp, 8000).then(() => {
        const bodies = pluginBodies();
        const hostedItems = Object.values(tc.canvasSnapshot().canvases[instanceKey].cards).filter((item) => item.plugin !== void 0);
        log("PLUGINSPEC ok=" + spec.ok + " changed=" + spec.changed +
          " summary=" + JSON.stringify(spec.summary) +
          " hosts=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-pluginHost").length +
          " stamps=" + bodies.map((node) => stampOf(node)).join("/") +
          " loads=" + globalThis.__DSH_DEMO_LOADS__ +
          " rebuilt=" + (stampOf(bodies[0]) !== firstStamp) +
          " badges=" + [...document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-pluginBadge")].map((node) => node.textContent).join("/") +
          " titles=" + hostedItems.map((item) => item.title).join("/"));
        return null;
      });
    });
  });
  /**
   * The **main conversation** route: a [canvas] block sitting in a chat row is picked up by the
   * plugin's watcher, applied to the canvas it names, and reported on the board as a notice that
   * opens exactly that canvas. It runs last on purpose: swapping canvases while plugin items are
   * hosted on the plane is part of what this checks.
   */
  const conversationPhase = () => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    tc.startTaskCardWatcher();
    const row = document.createElement("div");
    row.setAttribute("data-chat-anchor-key", "conv-canvas-1");
        row.setAttribute("data-chat-flow-kind", "assistant");
        row.style.display = "none";
        row.textContent = '[canvas] { "canvas": "主对话画布", "ops": [ { "op": "addPlugin", "id": "' + demoPluginId + '", "title": "主对话加的插件" } ] } [/canvas]';
        document.body.appendChild(row);
        const convCanvasOf = () => Object.values(tc.canvasSnapshot().canvases).find((item) => item.name === "主对话画布") ?? null;
        return waitFor(() => convCanvasOf() !== null && Object.values(convCanvasOf().cards).some((item) => item.title === "主对话加的插件"), 15000).then((convApplied) => {
          const notice = document.querySelector(".dsh-tc-notice");
          const convCanvas = convCanvasOf();
          const pluginState2 = tc.taskPluginState(demoPluginId);
          log("CONVERSATION applied=" + convApplied +
            " canvas=" + (convCanvas === null ? "none" : convCanvas.id === tc.canvasSnapshot().activeId ? "active" : "idle") +
            " items=" + (convCanvas === null ? -1 : Object.keys(convCanvas.cards).length) +
            " plugin=" + (convCanvas === null ? "none" : Object.values(convCanvas.cards).some((item) => item.plugin !== void 0)) +
            " state=" + pluginState2.state +
            " notice=" + JSON.stringify(notice === null ? "none" : notice.textContent));
          if (notice !== null) notice.click();
          // Any DOM teardown that goes wrong while the canvas swaps throws from this flush.
          let clickError = "none";
          try { ReactDOM.flushSync(() => {}); } catch (error) { clickError = String(error !== null && error.message ? error.message : error).slice(0, 80); }
          return new Promise((resolve) => setTimeout(resolve, 150)).then(() => {
            const nameInput = document.querySelector(".dsh-tc-canvasName");
            log("CONVERSATIONCLICK view=" + (document.querySelector(".dsh-tc-canvasView") !== null) +
              " name=" + JSON.stringify(nameInput === null ? "none" : nameInput.value) +
              " active=" + (convCanvasOf() !== null && tc.canvasSnapshot().activeId === convCanvasOf().id) +
              " hosts=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-pluginHost").length +
              " error=" + JSON.stringify(clickError) +
              " noticeGone=" + (document.querySelector(".dsh-tc-notice") === null));
            const planCards = document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-card").length;
            // The reply that really failed on this canvas (transcribed from the session): every
            // block named its kind as the key instead of using the kind field. Nothing may land
            // as an "unsupported control" box — the controls have to be built.
            const planRow = document.createElement("div");
            planRow.setAttribute("data-chat-anchor-key", "conv-canvas-2");
            planRow.setAttribute("data-chat-flow-kind", "assistant");
            planRow.style.display = "none";
            planRow.textContent = '[canvas] { "canvas": "主对话画布", "ops": [ { "op": "addCard", "title": "股市趋势", "blocks": [ { "heading": "股市趋势", "text": "主要指数与板块表现（示意数据）" }, { "stats": [ { "label": "上证指数", "value": "3,215.42" } ] }, { "trend": { "label": "上证指数", "unit": "点", "values": [3178.4, 3192.1, 3169.8] } }, { "kv": { "rows": [ [ "上证指数", "3,215.42" ] ] } }, { "note": { "text": "示意样本。" } } ] }, { "op": "add", "kind": "trend", "x": 700, "y": 560, "label": "深证成指", "values": [10180.2, 10210.6] } ] } [/canvas]';
            document.body.appendChild(planRow);
            return waitFor(() => document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare[data-kind=\\"trend\\"]").length > 0, 15000).then((built) => {
              const unsupported = document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-wUnsupported");
              const kinds = [...document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare")].map((node) => node.getAttribute("data-kind")).sort().join(",");
              const shapes = [...document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare[data-kind=\\"trend\\"]")].map((node) => node.querySelectorAll("svg, .dsh-tc-trendPt").length);
              const convCanvasNow = convCanvasOf();
              log("RECORDED built=" + built +
                " cards=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-card").length + "(was " + planCards + ")" +
                " bare=" + document.querySelectorAll(".dsh-tc-canvasPlane .dsh-tc-bare").length +
                " kinds=" + kinds +
                " unsupported=" + unsupported.length +
                " trendMarks=" + shapes.join("/") +
                " stored=" + JSON.stringify(convCanvasNow === null ? "none" : Object.values(convCanvasNow.cards).map((item) => (item.blocks ?? []).map((block) => block.kind).join("+")).join("|")));
              tc.stopTaskCardWatcher();
              row.remove();
              planRow.remove();
              // ---- images: a reachable source renders, an unreachable one explains itself ----
              // A remote src is fetched by the browser, so it can fail for reasons this plugin
              // never sees. The item must say which address failed and offer a way out, and the
              // local-file way out must really replace the control.
              const imageCanvasId = tc.canvasSnapshot().activeId;
              tc.canvasAddControl(imageCanvasId, "image", 20, 700, { kind: "image", src: "http://127.0.0.1:${PORT}/pixel.png", caption: "本地可达图片" });
              tc.canvasAddControl(imageCanvasId, "image", 420, 700, { kind: "image", src: "http://127.0.0.1:${PORT}/missing-image.png", caption: "取不到的图片" });
              ReactDOM.flushSync(() => {});
              const loadedImages = () => [...document.querySelectorAll(".dsh-tc-img")].filter((node) => node.naturalWidth > 0).length;
              return waitFor(() => document.querySelectorAll(".dsh-tc-imgFailed").length > 0 && loadedImages() > 0, 12000).then((settled) => {
                const failedBox = document.querySelector(".dsh-tc-imgFailed");
                const picker = failedBox === null ? null : failedBox.querySelector(".dsh-tc-imgFailFile");
                log("IMAGE settled=" + settled +
                  " imgs=" + document.querySelectorAll(".dsh-tc-img").length +
                  " loaded=" + loadedImages() +
                  " failed=" + document.querySelectorAll(".dsh-tc-imgFailed").length +
                  " picker=" + (picker !== null) +
                  " hint=" + JSON.stringify(String(failedBox === null ? "" : failedBox.textContent).slice(0, 90)));
                if (picker === null) return false;
                return fetch("http://127.0.0.1:${PORT}/pixel.png")
                  .then((answer) => answer.blob())
                  .then((blob) => {
                    // The real path: a local file picked in the failure box is read, downscaled
                    // and written back as a data URL, so the picture renders without any network.
                    const transfer = new DataTransfer();
                    transfer.items.add(new File([blob], "pixel.png", { type: "image/png" }));
                    picker.files = transfer.files;
                    picker.dispatchEvent(new Event("change", { bubbles: true }));
                    ReactDOM.flushSync(() => {});
                    return waitFor(() => document.querySelectorAll(".dsh-tc-imgFailed").length === 0 && loadedImages() >= 2, 12000);
                  })
                  .then(() => waitFor(() => document.querySelectorAll(".dsh-tc-imgFailed").length === 0 && loadedImages() >= 2, 12000))
                  .then((replaced) => {
                    const stored = Object.values(tc.canvasSnapshot().canvases[imageCanvasId].cards)
                      .filter((item) => (item.blocks ?? [])[0]?.kind === "image")
                      .map((item) => (item.blocks[0].src.startsWith("data:image/") ? "local" : "remote"));
                    log("IMAGELOCAL replaced=" + replaced +
                      " loaded=" + loadedImages() +
                      " failed=" + document.querySelectorAll(".dsh-tc-imgFailed").length +
                      " stored=" + stored.sort().join(","));
                    // ---- links: draw one between two items, watch the dashed group, remove it ----
                    // Two fresh controls at known, non-overlapping spots: the earlier items cascade
                    // near the origin, so a hit test there would be ambiguous.
                    const linkCanvasId = tc.canvasSnapshot().activeId;
                    const nodesBefore = document.querySelectorAll(".dsh-tc-canvasPlane [data-id]").length;
                    const linkA = tc.canvasAddControl(linkCanvasId, "heading", 900, 40, { kind: "heading", text: "连线源" });
                    const linkB = tc.canvasAddControl(linkCanvasId, "kv", 900, 300, { kind: "kv", rows: [["共享键", "共享值"]] });
                    ReactDOM.flushSync(() => {});
                    return waitFor(() => document.querySelectorAll(".dsh-tc-canvasPlane [data-id]").length >= nodesBefore + 2, 6000).then(() => {
                    const linkItems = Object.values(tc.canvasSnapshot().canvases[linkCanvasId].cards);
                    const linkButton = document.querySelector('[data-id="' + linkA + '"] button[title^="与另一"]');
                    const linkProbe = document.querySelectorAll('button[title^="与另一"]').length + "/" + document.querySelectorAll(".dsh-tc-canvasPlane [data-id]").length;
                    if (linkButton !== null) linkButton.click();
                    ReactDOM.flushSync(() => {});
                    const band = document.querySelector(".dsh-tc-linkMode");
                    const bandHint = document.querySelector(".dsh-tc-linkModeHint");
                    const targetNode = document.querySelector('[data-id="' + linkB + '"]');
                    const targetRect = targetNode === null ? null : targetNode.getBoundingClientRect();
                    const scrollNode = document.querySelector(".dsh-tc-canvasScroll");
                    const scrollRect = scrollNode === null ? null : scrollNode.getBoundingClientRect();
                    const view = tc.canvasSnapshot().views[linkCanvasId] ?? { x: 0, y: 0, k: 1 };
                    const probe = targetRect === null || scrollRect === null ? "none" : JSON.stringify({
                      clickX: Math.round(targetRect.left + targetRect.width / 2 - scrollRect.left),
                      clickY: Math.round(targetRect.top + targetRect.height / 2 - scrollRect.top),
                      planeX: Math.round((targetRect.left + targetRect.width / 2 - scrollRect.left - view.x) / view.k),
                      planeY: Math.round((targetRect.top + targetRect.height / 2 - scrollRect.top - view.y) / view.k),
                      offset: targetNode === null ? "none" : [targetNode.offsetLeft, targetNode.offsetTop, targetNode.offsetWidth, targetNode.offsetHeight].join(","),
                      nodes: document.querySelectorAll(".dsh-tc-canvasPlane [data-id]").length
                    });
                    if (band !== null && targetRect !== null) {
                      band.dispatchEvent(new PointerEvent("pointerdown", {
                        bubbles: true, button: 0, pointerId: 21, pointerType: "mouse",
                        clientX: targetRect.left + targetRect.width / 2, clientY: targetRect.top + targetRect.height / 2
                      }));
                    }
                    ReactDOM.flushSync(() => {});
                    const linked = tc.canvasSnapshot().canvases[linkCanvasId];
                    const frameNode = document.querySelector(".dsh-tc-linkFrame");
                    const frameLabel = document.querySelector(".dsh-tc-linkFrameLabel");
                    const linkPrompt = tc.composeCanvasChatPrompt({ canvasId: linkCanvasId, canvas: linked }, "共享上下文");
                    log("LINK overlay=" + (band !== null) +
                      " hint=" + JSON.stringify(bandHint === null ? "none" : bandHint.textContent) +
                      " items=" + linkItems.length +
                      " links=" + Object.keys(linked.links).length +
                      " frames=" + document.querySelectorAll(".dsh-tc-linkFrame").length +
                      " frameCount=" + JSON.stringify(frameNode === null ? "none" : frameNode.getAttribute("data-count")) +
                      " edges=" + document.querySelectorAll(".dsh-tc-linkEdge").length +
                      " chips=" + document.querySelectorAll(".dsh-tc-linkChip").length +
                      " label=" + JSON.stringify(frameLabel === null ? "none" : frameLabel.textContent) +
                      " dashed=" + JSON.stringify(frameNode === null ? "none" : getComputedStyle(frameNode).borderStyle) +
                      " prompt=" + linkPrompt.includes("画布上已有的连线") +
                      " nodes=" + document.querySelectorAll(".dsh-tc-canvasPlane [data-id]").length +
                      " linkable=" + linkProbe +
                      " placed=" + probe +
                      " hintText=" + JSON.stringify(String(document.querySelector(".dsh-tc-canvasHint") === null ? "none" : document.querySelector(".dsh-tc-canvasHint").textContent).slice(0, 40)));
                    const chip = document.querySelector(".dsh-tc-linkChip");
                    if (chip !== null) chip.click();
                    ReactDOM.flushSync(() => {});
                    log("UNLINK links=" + Object.keys(tc.canvasSnapshot().canvases[linkCanvasId].links).length +
                      " frames=" + document.querySelectorAll(".dsh-tc-linkFrame").length +
                      " edges=" + document.querySelectorAll(".dsh-tc-linkEdge").length);
                    // ---- the 3D viewer control: a real glb on the canvas is really displayed ----
                    const modelCanvasId = tc.canvasSnapshot().activeId;
                    const modelItem = tc.canvasAddControl(modelCanvasId, "model", 1400, 40, {
                      kind: "model",
                      src: "data:application/octet-stream;base64," + ${JSON.stringify(cubeBase64)},
                      name: "cube.glb",
                      height: 360,
                      wireframe: false,
                      grid: true,
                      background: "dark"
                    });
                    ReactDOM.flushSync(() => {});
                    const modelNodeOf = () => document.querySelector('[data-id="' + modelItem + '"]');
                    return waitFor(() => {
                      const node = modelNodeOf();
                      const info = node === null ? null : node.querySelector(".dsh-tc-modelInfo");
                      return info !== null && /三角形/.test(info.textContent);
                    }, 20000).then((loadedModel) => {
                      const node = modelNodeOf();
                      const info = node === null ? null : node.querySelector(".dsh-tc-modelInfo");
                      const frame = node === null ? null : node.querySelector(".dsh-tc-modelFrame");
                      log("MODEL loaded=" + loadedModel +
                        " info=" + JSON.stringify(info === null ? "none" : info.textContent) +
                        " frame=" + (frame !== null) +
                        " sandbox=" + JSON.stringify(frame === null ? "none" : frame.getAttribute("sandbox")) +
                        " state=" + JSON.stringify(node === null ? "none" : node.querySelector(".dsh-tc-model").getAttribute("data-state")));
                      return true;
                    });
                    });
                  });
              });
            });
      });
    });
  };

  // ---- the page bridge: the agent operates the embedded app for real ----
  // The board card gains a *controlled* embed: that frame loads through the bridge, the
  // injected agent registers, and an action list runs inside the actual page.
  tc.saveTaskBridgeSettings({ url: "http://127.0.0.1:${BRIDGE_PORT}", token: "", enabled: true });
  const cardNow = tc.snapshotTaskCards().cards[applied.id];
  const controlledBlocks = [...(cardNow.blocks ?? []), { kind: "embed", url, title: "受控应用", height: 240, fill: false, control: true }];
  tc.applyTaskCardSpec({ op: "upsert", id: applied.id, title: "全屏应用卡", blocks: controlledBlocks });
  const appTarget = tc.taskBridgeTarget(url);
  void pluginPhase
    .catch((error) => log("PLUGINCHAIN " + String(error !== null && error.message ? error.message : error) + " @ " + String(error !== null && error.stack ? error.stack : "").split("\\n").slice(1, 3).join(" | ").slice(0, 300)))
    .then(() => new Promise((resolve) => setTimeout(resolve, 2200))) // iframe → proxy → injected agent → ws
    .then(async () => {
      ReactDOM.flushSync(() => {});
      const before = tc.taskBridgePageState(appTarget);
      const executed = await tc.runPageBlockFromReply(
        '[page] { "actions": [ { "action": "read" }, { "action": "click", "selector": "#b" }, { "action": "click", "selector": "#b" }, { "action": "read" } ] } [/page]',
        controlledBlocks
      );
      const seen = Array.isArray(executed !== null && executed !== void 0 ? executed.results : null)
        ? executed.results.map((entry) => (entry.result !== null && entry.result !== void 0 && entry.result.value !== null && entry.result.value !== void 0 && typeof entry.result.value.text === "string" ? entry.result.value.text : "")).join(" | ")
        : "";
      const badge = document.querySelector(".dsh-tc-appBadge");
      log("BRIDGE state=" + before.state +
        " title=" + JSON.stringify(before.title) +
        " ok=" + (executed !== null && executed !== void 0 && executed.ok === true) +
        " count=" + (executed !== null && executed !== void 0 ? executed.total : -1) +
        " clicks=" + (/点击 2 次/.test(seen) ? 2 : /点击 1 次/.test(seen) ? 1 : 0) +
        " badge=" + (badge === null ? "none" : badge.textContent) +
        " summary=" + JSON.stringify(String(executed !== null && executed !== void 0 ? executed.summary : "").slice(0, 160)));
    })
    .catch((error) => log("BRIDGECHAIN " + String(error !== null && error.message ? error.message : error)))
    .then(() => conversationPhase())
    .catch((error) => log("CONVERSATIONCHAIN " + String(error !== null && error.message ? error.message : error)))
    .then(() => { window.__dshHarnessDone = true; });
} catch (error) {
  log("ERROR " + (error && error.message ? error.message : String(error)));
  window.__dshHarnessDone = true;
}
<\/script>
</body></html>`;

mkdirSync(OUT, { recursive: true });
const harness = join(OUT, "index.html");
writeFileSync(harness, page);
const boardHarness = join(OUT, "board.html");
writeFileSync(boardHarness, boardPage);
const shot = join(OUT, "card-embed.png");
const boardShot = join(OUT, "card-instance.png");

// Chrome runs asynchronously on purpose: execFileSync would block this process'
// event loop, so the local app server could never answer the iframe requests.
// One invocation both screenshots the page and dumps its DOM — two back-to-back
// instances race and the second one can come back empty.
let runIndex = 0;
const runChrome = (args, profileName) => new Promise((resolve) => {
  runIndex += 1;
  const profile = join(OUT, "chrome-profile-" + profileName + "-" + runIndex);
  // A fresh profile per run: a reused one can serve the previously loaded
  // bundle from its cache, which would verify the old client.js.
  rmSync(profile, { recursive: true, force: true });
  const child = spawn(chrome, [...args, "--user-data-dir=" + profile], { stdio: ["ignore", "pipe", "ignore"] });
  let out = "";
  child.stdout.on("data", (chunk) => { out += chunk; });
  child.on("exit", () => resolve(out));
});
const fileUrl = (path) => "file:///" + path.replace(/\\/g, "/");

/**
 * Drive the board harness over the DevTools protocol: real time (no virtual clock), so
 * WebSocket handshakes and the plugin's own timeouts behave exactly as in a browser.
 * Waits until the page sets `window.__dshHarnessDone`, then reads the log and screenshots.
 */
async function runBoardPhase(url, screenshotPath) {
  const profile = join(OUT, "chrome-cdp-profile");
  rmSync(profile, { recursive: true, force: true });
  const child = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox", "--hide-scrollbars",
    "--allow-file-access-from-files", "--remote-debugging-port=0", "--window-size=1280,860",
    "--user-data-dir=" + profile, "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("devtools endpoint timeout")), 20000);
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      const match = /ws:\/\/[^\s]+/.exec(stderr);
      if (match !== null) { clearTimeout(timer); resolve(match[0]); }
    });
    child.on("exit", () => { clearTimeout(timer); reject(new Error("chrome exited: " + stderr.slice(-300))); });
  });
  const browser = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    browser.addEventListener("open", () => resolve());
    browser.addEventListener("error", () => reject(new Error("devtools socket error")));
  });
  let nextId = 1;
  const pending = new Map();
  browser.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id === void 0) return;
    const settle = pending.get(message.id);
    if (settle === void 0) return;
    pending.delete(message.id);
    if (message.error !== void 0) settle.reject(new Error(JSON.stringify(message.error)));
    else settle.resolve(message.result);
  });
  const send = (sessionId, method, params) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    browser.send(JSON.stringify(sessionId === null ? { id, method, params } : { id, sessionId, method, params }));
  });
  const evaluate = async (sessionId, expression) => {
    const result = await send(sessionId, "Runtime.evaluate", { expression, returnByValue: true, awaitPromise: false });
    return result.result === void 0 ? null : result.result.value;
  };
  try {
    const { targetId } = await send(null, "Target.createTarget", { url });
    const { sessionId } = await send(null, "Target.attachToTarget", { targetId, flatten: true });
    await send(sessionId, "Page.enable");
    const deadline = Date.now() + 40000;
    let done = false;
    while (Date.now() < deadline) {
      done = (await evaluate(sessionId, "window.__dshHarnessDone === true")) === true;
      if (done) break;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    const log = await evaluate(sessionId, "document.getElementById('log') === null ? '' : document.getElementById('log').textContent");
    const shot = await send(sessionId, "Page.captureScreenshot", { format: "png" });
    writeFileSync(screenshotPath, Buffer.from(shot.data, "base64"));
    return { log: typeof log === "string" ? log : "", done };
  } finally {
    try { browser.close(); } catch { /* closing */ }
    try { child.kill(); } catch { /* already gone */ }
  }
}
const dom = await runChrome([
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox", "--hide-scrollbars",
  "--allow-file-access-from-files", "--virtual-time-budget=9000", "--window-size=1000,900",
  "--screenshot=" + shot, "--dump-dom", fileUrl(harness),
], "drag");
const boardReport = await runBoardPhase(fileUrl(boardHarness), boardShot);
server.close();
void bridge.close();
console.log("browser   ", chrome);
console.log("screenshots", shot + " | " + boardShot);

const readReport = (source) => {
  const report = /<pre id="log"[^>]*>([\s\S]*?)<\/pre>/.exec(source);
  return report === null ? "" : report[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
};
if (process.env.DSH_EMBED_DEBUG === "1") writeFileSync(join(OUT, "dom-dump.html"), dom);
const text = readReport(dom);
const boardText = boardReport.log.trim();
console.log("---- cards/embed harness ----");
console.log(text === "" ? "no page report" : text);
console.log("---- board/canvas/bridge harness ----");
console.log(boardText === "" ? "no page report" : boardText);
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
const instance = /INSTANCE view=(\w+) title=(\S+) items=(\d+) apps=(\d+) bound=(\d+) oneControlEach=(\w+) sourceCopy=(\w+) rebuild=(\w+) backToBoard=(\w+) hasNewCanvas=(\w+)/.exec(boardText);
const reorder = /REORDER before=(\S+) after=(\S+)/.exec(boardText);
const full = /FULL overlay=(\w+) shell=(-?\d+) app=(-?\d+) frame=(-?\d+) appFill=(\w+) viewport=(\d+)x(\d+) hint=(.*)/.exec(boardText);
const shellHeight = full === null ? -1 : Number(full[2]);
const frameHeight = full === null ? -1 : Number(full[4]);
const viewportHeight = full === null ? -1 : Number(full[7]);
const bareMove = /BAREDRAG before=\{"left":"(-?\d+)px","top":"(-?\d+)px"\} after=\{"left":"(-?\d+)px","top":"(-?\d+)px"\}/.exec(boardText);
// hosting another plugin: the picker path, then the protocol path (add + rebuild)
const pluginLine = /PLUGIN picker=true panel=true chips=(\d+) chip=true state=mounted mounted=true entry="__DSH_DEMO__" stamp=(load-\d+-build-\d+)/.exec(boardText);
const pluginSpecLine = /PLUGINSPEC ok=true changed=2 summary="新增插件 1 · 重建插件 1" hosts=2 stamps=(\S+) loads=(\d+) rebuilt=true badges=([^ ]*) titles=(\S+)/.exec(boardText);
const pluginStamps = pluginSpecLine === null ? [] : pluginSpecLine[1].split("/");
const pluginOk = pluginLine !== null &&
  Number(pluginLine[1]) >= 1 &&
  // the mounted UI really came from the plugin's own bundle (its React render ran)
  boardText.includes('text="PLUGIN OK ' + pluginLine[2] + ' · id=dsh-plugin-demo"') &&
  boardText.includes('status="已挂载 ' + pluginLine[2] + '"');
const pluginSpecOk = pluginSpecLine !== null &&
  pluginStamps.length === 2 &&
  // one bundle load serves the second item; the rebuild is the load that re-materializes it
  Number(pluginSpecLine[2]) === 2 &&
  pluginStamps.includes(pluginLine === null ? "" : pluginLine[2]) === false &&
  pluginStamps.every((stamp) => stamp.startsWith("load-")) &&
  pluginSpecLine[3] === "已挂载/已挂载" &&
  pluginSpecLine[4].split("/").includes("协议加的插件");
const instanceOk = instance !== null &&
  instance[1] === "true" &&
  instance[2] === "副本画布" &&
  // one canvas item per control, one of them holding the embedded app
  instance[3] === "3" &&
  instance[4] === "1" &&
  instance[5] === "3" &&
  instance[6] === "true" &&
  instance[7] === "true" &&
  instance[8] === "true" &&
  instance[9] === "true" &&
  // instance mode hides the normal canvas management controls
  instance[10] === "false" &&
  // dragging a control on the plane reorders it on the board card (thumbnail mapping)
  reorder !== null &&
  reorder[1] !== reorder[2] &&
  reorder[1].startsWith("wHead|") &&
  // a conversation refactor lands on the plane: kept control stays put (with its new
  // label), the dropped one is gone, the added one appears — one item per control
  /REFACTOR ok=true items=3 kept=true place=true domItems=3 titles=.*说明/.test(boardText) &&
  boardText.includes("小标题 · 重构后的标题") &&
  // the canvas chat dock exists and a [canvas] op list edits the plane (rename + note too)
  // the canvas chat is a narrow centred floating panel (340px, 16px above the bottom)
  // and a [canvas] op list edits the plane (rename + note too)
  /CHAT input=true send=true placeholder=一句话改画布… dockW=34[02] centerOffset=0 gapBottom=16 floating=true bareBefore=1 bareAfter=2 changed=2 storeName=对话改名的副本 storeCards=\d+ domName=对话改名的副本 note=\["已加上倒计时"\]/.test(boardText) &&
  // any control can be added straight onto the plane, then dragged by its own toolbar
  /ADD menu=true chips=19 bare=1 kind=counter noCardChrome=true hasCounter=true/.test(boardText) &&
  // the bare control followed the pointer by exactly the dispatched delta
  bareMove !== null &&
  Number(bareMove[3]) === Number(bareMove[1]) + 120 &&
  Number(bareMove[4]) === Number(bareMove[2]) + 60 &&
  boardText.includes("DERIVE items=4 bare=1 apps=1") &&
  // another plugin's UI is hosted on the canvas, not just cards: the 🧩 picker loads its
  // client bundle from the boot manifest and mounts its embed entry into the item
  pluginOk &&
  // and the same feature works from a [canvas] op list: addPlugin adds a second item,
  // rebuild re-materializes the bundle (load-2) and remounts it
  pluginSpecOk &&
  // the **main conversation** route: a [canvas] block in a chat row is picked up, applied to
  // the canvas it names, and the board shows a notice that opens exactly that canvas
  /CONVERSATION applied=true canvas=active items=1 plugin=true state=mounted notice="画布「主对话画布」已应用：新增插件 1"/.test(boardText) &&
  /CONVERSATIONCLICK view=true name="主对话画布" active=true hosts=1 error="none" noticeGone=true/.test(boardText) &&
  // the reply that failed on this canvas (kind written as the key) now builds real controls:
  // the five-control card plus the bare trend item, and no "unsupported" boxes at all
  /RECORDED built=true cards=\d+\(was \d+\) bare=1 kinds=trend unsupported=0 trendMarks=[1-9]/.test(boardText) &&
  /RECORDED .*stored="[^"]*heading\+stats\+trend\+kv\+note/.test(boardText) &&
  // images: the reachable one is really rendered, the unreachable one says which host failed…
  /IMAGE settled=true imgs=1 loaded=1 failed=1 picker=true hint="图片加载失败取不到 127\.0\.0\.1/.test(boardText) &&
  // …and picking a local file replaces the control with a data URL that renders without network
  /IMAGELOCAL replaced=true loaded=2 failed=0 stored=local,remote/.test(boardText) &&
  // links: 🔗 starts the drawing mode, clicking the second item connects them, the group gets
  // a dashed frame around it, and the chip on the edge removes it again
  /LINK overlay=true hint="连线中：点另一张卡片完成连线（Esc 或右键取消）" items=7 links=1 frames=1 frameCount="2" edges=1 chips=1 label="⚯ 工作区上下文共享 · 2 项" dashed="dashed" prompt=true/.test(boardText) &&
  /UNLINK links=0 frames=0 edges=0/.test(boardText) &&
  // the 3D viewer control really parses the glb in its sandboxed frame and reports it
  /MODEL loaded=true info="12 三角形 · 1 网格" frame=true sandbox="allow-scripts" state="ready"/.test(boardText) &&
  // the agent operated the real embedded page through the bridge
  /BRIDGE state=connected title="本地应用" ok=true count=4 clicks=2 badge=受控 · 已连接/.test(boardText);
const fullOk = boardText.includes("BOARD cards=") &&
  full !== null &&
  full[1] === "true" &&
  full[5] === "true" &&
  full[8].includes("Esc") &&
  // the fullscreen shell is nearly the whole viewport and the app fills it
  shellHeight > viewportHeight * 0.85 &&
  frameHeight > viewportHeight * 0.6 &&
  // Esc closes the overlay but keeps the instance canvas underneath
  boardText.includes("ESCAPE overlay=true instance=true");
console.log(ok && instanceOk && fullOk ? "ALL PASS" : "FAILURES");
if (process.env.DSH_EMBED_DEBUG === "1") {
  console.log("DEBUG ok=" + ok + " instanceOk=" + instanceOk + " fullOk=" + fullOk);
  console.log("DEBUG instance=" + JSON.stringify(instance));
  console.log("DEBUG reorder=" + JSON.stringify(reorder) + " bareMove=" + JSON.stringify(bareMove));
  console.log("DEBUG full=" + JSON.stringify(full));
  console.log("DEBUG add=" + /ADD menu=true chips=19 bare=1 kind=counter noCardChrome=true hasCounter=true/.test(boardText));
  console.log("DEBUG chat=" + /CHAT input=true send=true placeholder=用一句话修改这块画布 bareBefore=1 bareAfter=2 changed=2 storeName=对话改名的副本 storeCards=\d+ domName=对话改名的副本 note=\["已加上倒计时"\]/.test(boardText));
  console.log("DEBUG derive=" + boardText.includes("DERIVE items=4 bare=1 apps=1"));
  console.log("DEBUG plugin=" + pluginOk + " pluginSpec=" + pluginSpecOk + " " + JSON.stringify(pluginSpecLine));
  console.log("DEBUG escape=" + boardText.includes("ESCAPE overlay=true instance=true"));
}
process.exit(ok && instanceOk && fullOk ? 0 : 1);
