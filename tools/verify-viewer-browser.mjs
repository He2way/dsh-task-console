// Verify the embedded 3D viewer in a real browser.
//
//   npm run verify:viewer
//
// Builds a small glTF-binary cube in-process, mounts viewer/viewer.html in a headless
// Chromium iframe and drives it exactly like the workbench does (postMessage only):
// load a model, orbit it with the pointer, toggle the wireframe and options, then feed it
// a broken file. Needs Chrome; otherwise the check is skipped (exit 0) so `npm test` on a
// machine without a browser never breaks.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { buildCubeGlb } from "./cube-glb.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = join(tmpdir(), "dsh-task-console-viewer-check");

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
if (chrome === null) {
  console.log("SKIP: missing Chrome (set CHROME_PATH)");
  process.exit(0);
}

const viewerHtml = readFileSync(join(ROOT, "viewer", "viewer.html"), "utf8");
if (viewerHtml.length < 2000) throw new Error("viewer/viewer.html looks empty");
// The viewer carries its own <script> tags: they must not close the harness page's script.
const viewerLiteral = JSON.stringify(viewerHtml).replace(/<\/script/gi, "<\\/script");
const cube = buildCubeGlb();
const cubeBase64 = cube.toString("base64");

const page = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>viewer check</title>
<style>html,body{margin:0;height:100%}iframe{width:640px;height:420px;border:0}</style></head><body>
<pre id="log" style="font:11px/1.5 monospace"></pre>
<iframe id="viewer"></iframe>
<script>
const log = (message) => { document.getElementById("log").textContent += message + "\\n"; };
const seen = [];
let step = 0;
const viewer = document.getElementById("viewer");
const buffer = Uint8Array.from(atob(${JSON.stringify(cubeBase64)}), (character) => character.charCodeAt(0)).buffer;
const send = (message, transfer) => viewer.contentWindow.postMessage(message, "*", transfer ?? []);
const waitFor = (predicate, budget) => new Promise((resolve) => {
  const started = Date.now();
  const tick = () => {
    const found = seen.find(predicate);
    if (found !== void 0) { resolve(found); return; }
    if (Date.now() - started > budget) { resolve(null); return; }
    setTimeout(tick, 30);
  };
  tick();
});
viewer.srcdoc = ${viewerLiteral};
window.addEventListener("message", (event) => {
  if (event.source !== viewer.contentWindow) return;
  const message = event.data;
  if (message === null || typeof message !== "object") return;
  seen.push(message);
  if (message.type === "ready") start();
});
setTimeout(() => {
  let inner = "n/a";
  let boot = "n/a";
  try {
    const doc = viewer.contentDocument;
    inner = doc === null ? "null-doc" : doc.getElementById("overlay") === null ? "no-overlay" : doc.getElementById("overlay").textContent;
    boot = String(viewer.contentWindow.__viewerBoot) + " err=" + JSON.stringify(String(viewer.contentWindow.__viewerError ?? "none"));
  } catch (error) { inner = "err:" + String(error !== null && error.message ? error.message : error); }
  log("DIAG window=" + (viewer.contentWindow === null ? "null" : "ok") + " doc=" + (viewer.contentDocument === null ? "null" : "ok") + " boot=" + boot + " overlay=" + JSON.stringify(String(inner).slice(0, 70)) + " seen=" + seen.length + " types=" + seen.map((message) => message.type).join(","));
}, 2500);
const orbit = () => {
  const canvas = viewer.contentDocument.getElementById("gl");
  const box = canvas.getBoundingClientRect();
  const pointer = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, button: 0, buttons: 1, pointerId: 3, pointerType: "mouse", clientX: x, clientY: y }));
  pointer("pointerdown", box.left + 200, box.top + 200);
  pointer("pointermove", box.left + 320, box.top + 240);
  pointer("pointermove", box.left + 380, box.top + 260);
  pointer("pointerup", box.left + 380, box.top + 260);
};
const run = async () => {
  send({ type: "load", name: "cube.glb", buffer }, [buffer]);
  const loaded = await waitFor((message) => message.type === "status" && (message.ok === true ? message.triangles > 0 : message.message.length > 0), 8000);
  if (loaded !== null && loaded.ok !== true) log("LOAD failed message=" + JSON.stringify(loaded.message.slice(0, 90)));
  log("LOAD ok=" + (loaded !== null) + (loaded === null ? "" : " triangles=" + loaded.triangles + " meshes=" + loaded.meshes + " materials=" + loaded.materials + " size=" + loaded.size.join("x") + " name=" + loaded.name));
  const before = seen.filter((message) => message.type === "camera").length;
  orbit();
  const dragged = viewer.contentWindow.__viewerInfo();
  const camera = await waitFor((message) => message.type === "camera" && Math.abs(message.yaw - 0.6) > 0.05, 3000);
  log("ORBIT yaw=" + dragged.yaw.toFixed(3) + " pitch=" + dragged.pitch.toFixed(3) + " distance=" + dragged.distance.toFixed(3) +
    " dragging=" + dragged.dragging + " cameraMessages=" + (seen.filter((message) => message.type === "camera").length - before) +
    " reported=" + (camera !== null));
  send({ type: "options", wireframe: true, grid: false, background: "light" });
  const options = await waitFor((message) => message.type === "status" && message.wireframe === true && message.grid === false, 4000);
  log("OPTIONS wireframe=" + (options !== null) + (options === null ? "" : " background=" + options.background));
  send({ type: "load", name: "broken.glb", buffer: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer });
  const failed = await waitFor((message) => message.type === "status" && message.ok === false && message.message.length > 0, 4000);
  log("ERROR reported=" + (failed !== null) + (failed === null ? "" : " message=" + JSON.stringify(failed.message.slice(0, 70))));
  send({ type: "clear" });
  const cleared = await waitFor((message) => message.type === "status" && message.triangles === 0, 4000);
  log("CLEAR cleared=" + (cleared !== null));
  log("DONE");
};
const start = () => { if (step === 0) { step = 1; run(); } };
setTimeout(() => { if (step === 0) { log("TIMEOUT no ready from the viewer"); log("DONE"); } }, 8000);
<\/script></body></html>`;

mkdirSync(OUT, { recursive: true });
const harness = join(OUT, "viewer-check.html");
writeFileSync(harness, page);

const fileUrl = (path) => "file:///" + path.replace(/\\/g, "/");
const profile = join(OUT, "chrome-profile");
rmSync(profile, { recursive: true, force: true });
const dom = await new Promise((resolve) => {
  const child = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox", "--hide-scrollbars",
    "--allow-file-access-from-files", "--virtual-time-budget=20000", "--window-size=900,600",
    "--user-data-dir=" + profile, "--dump-dom", fileUrl(harness),
  ], { stdio: ["ignore", "pipe", "ignore"] });
  let out = "";
  child.stdout.on("data", (chunk) => { out += chunk; });
  child.on("exit", () => resolve(out));
});
if (process.env.DSH_VIEWER_DEBUG === "1") writeFileSync(join(OUT, "dom-dump.html"), dom);

const report = /<pre id="log"[^>]*>([\s\S]*?)<\/pre>/.exec(dom);
const text = report === null ? "" : report[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
console.log("browser ", chrome);
console.log("glb     ", cube.length + " bytes");
console.log("---- viewer harness ----");
console.log(text === "" ? "no page report" : text);

const load = /LOAD ok=true triangles=(\d+) meshes=(\d+) materials=(\d+) size=([\d.x]+) name=(\S+)/.exec(text);
const orbit = /ORBIT yaw=(-?[\d.]+) pitch=(-?[\d.]+) distance=([\d.]+) dragging=(true|false) cameraMessages=(\d+) reported=(true|false)/.exec(text);
const ok = load !== null &&
  // 12 triangles, one mesh, one material, and a unit cube's bounding box
  Number(load[1]) === 12 &&
  Number(load[2]) === 1 &&
  Number(load[3]) === 1 &&
  load[4].split("x").every((side) => Math.abs(Number(side) - 1) < 1e-6) &&
  load[5] === "cube.glb" &&
  // the pointer really orbited the camera, and the drag ended cleanly
  orbit !== null &&
  Math.abs(Number(orbit[1]) - 0.6) > 0.05 &&
  Math.abs(Number(orbit[2]) - 0.42) > 0.05 &&
  Number(orbit[3]) > 0 &&
  orbit[4] === "false" &&
  text.includes("OPTIONS wireframe=true background=light") &&
  /ERROR reported=true message="[^"]+"/.test(text) &&
  text.includes("CLEAR cleared=true") &&
  text.includes("DONE");
console.log(ok ? "ALL PASS" : "FAILURES");
if (process.env.DSH_VIEWER_DEBUG === "1") {
  console.log("DEBUG load=" + JSON.stringify(load));
  console.log("DEBUG orbit=" + JSON.stringify(orbit));
}
process.exit(ok ? 0 : 1);
