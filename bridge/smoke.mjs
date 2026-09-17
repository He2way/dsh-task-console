// Smoke test for the page bridge (bridge/server.mjs).
//
// Run: npm run test:bridge
//
// Covers the HTTP side (health, the injected script, the proxy + injection, the
// token gate, the host allow-list, non-HTML passthrough) and the WebSocket side
// (page registration, host→page command routing, results coming back, the
// no-page/timeout paths, and the in-process `bridge.command()` helper).
import { createServer } from "node:http";
import { startBridge, maskedFrame, createFrameReader, hostAllowed, targetKey } from "./server.mjs";

let failed = 0;
const check = (name, ok) => {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
};

// ---- a tiny target app to proxy ----
const targetServer = createServer((request, response) => {
  if ((request.url ?? "").startsWith("/data.json")) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ hello: "world" }));
    return;
  }
  response.writeHead(200, { "content-type": "text/html; charset=utf-8", "x-frame-options": "DENY", "content-security-policy": "frame-ancestors 'none'" });
  response.end("<!DOCTYPE html><html><head><title>目标页</title></head><body><h1>目标页</h1><button id=\"go\">出发</button></body></html>");
});
await new Promise((resolve) => targetServer.listen(0, "127.0.0.1", resolve));
const targetPort = targetServer.address().port;
const targetUrl = `http://127.0.0.1:${targetPort}/`;

const bridge = startBridge({ port: 0, host: "127.0.0.1", token: "s3cret", timeout: 3000 });
await bridge.ready;
const bridgePort = bridge.server.address().port;
const base = `http://127.0.0.1:${bridgePort}`;

// ---- HTTP ----
const health = await (await fetch(`${base}/healthz`)).json();
check("healthz reports an empty bridge", health.ok === true && Array.isArray(health.pages) && health.pages.length === 0 && health.hosts === 0);

const script = await fetch(`${base}/bridge.js`);
const scriptText = await script.text();
check(
  "the injected script is served",
  script.status === 200 &&
    (script.headers.get("content-type") ?? "").includes("javascript") &&
    scriptText.includes("__dshPageBridge") &&
    scriptText.includes("role=page&target=")
);

check("the proxy refuses a request without the token", (await fetch(`${base}/p?url=${encodeURIComponent(targetUrl)}`)).status === 403);
check("the proxy refuses a non-http url", (await fetch(`${base}/p?url=${encodeURIComponent("javascript:alert(1)")}&token=s3cret`)).status === 400);

const proxied = await fetch(`${base}/p?url=${encodeURIComponent(targetUrl)}&token=s3cret`);
const proxiedHtml = await proxied.text();
const key = targetKey(targetUrl);
check(
  "the proxy injects the page agent",
  proxied.status === 200 &&
    proxiedHtml.includes('<script src="/bridge.js?target=' + key + "&token=s3cret\"></script>") &&
    proxiedHtml.includes("目标页") &&
    // framing headers from the target are dropped so the card can embed it
    proxied.headers.get("x-frame-options") === null &&
    proxied.headers.get("content-security-policy") === null
);
check("the target key is stable", targetKey(targetUrl) === key && key.startsWith("t") && key.length === 13);
const json = await fetch(`${base}/p?url=${encodeURIComponent(targetUrl + "data.json")}&token=s3cret`);
check("non-HTML responses pass through untouched", (json.headers.get("content-type") ?? "").includes("json") && (await json.json()).hello === "world");
check("the status page renders", (await (await fetch(`${base}/`)).text()).includes("page bridge"));
check("host allow-list matching", hostAllowed("example.com", []) === true && hostAllowed("api.example.com", ["*.example.com"]) === true && hostAllowed("example.com:5173", ["example.com"]) === true && hostAllowed("evil.test", ["example.com"]) === false);

// ---- WebSocket: page agent ← → workbench ----
const openSocket = (query, onText) => new Promise((resolve, reject) => {
  const socket = new globalThis.WebSocket(`ws://127.0.0.1:${bridgePort}/ws?${query}`);
  socket.addEventListener("open", () => resolve(socket));
  socket.addEventListener("error", () => reject(new Error("socket error")));
  socket.addEventListener("message", (event) => onText(socket, JSON.parse(String(event.data))));
});

const pageSeen = [];
const hostSeen = [];
const pageSocket = await openSocket(`role=page&target=${key}&token=s3cret`, (socket, message) => {
  pageSeen.push(message);
  if (message.type === "command") {
    socket.send(JSON.stringify({ type: "result", id: message.id, ok: true, value: { clicked: message.selector ?? message.text ?? null } }));
  }
});
const hostSocket = await openSocket(`role=host&target=${key}&token=s3cret`, (socket, message) => hostSeen.push(message));
pageSocket.send(JSON.stringify({ type: "hello", target: key, url: targetUrl, title: "目标页" }));
await new Promise((resolve) => setTimeout(resolve, 120));
check(
  "a page registers and the workbench is told",
  (bridge.pages.get(key)?.size ?? 0) === 1 && hostSeen.some((message) => message.type === "page" && message.state === "connected" && message.title === "目标页")
);
check(
  "healthz lists the connected page",
  (await (await fetch(`${base}/healthz`)).json()).pages[0].url === targetUrl
);

hostSocket.send(JSON.stringify({ type: "command", id: "cmd-1", action: "click", selector: "#go" }));
await new Promise((resolve) => setTimeout(resolve, 150));
check(
  "a command reaches the page and its result returns",
  pageSeen.some((message) => message.type === "command" && message.id === "cmd-1" && message.action === "click") &&
    hostSeen.some((message) => message.type === "result" && message.id === "cmd-1" && message.ok === true && message.value.clicked === "#go")
);

const direct = await bridge.command(key, { action: "read" });
check("the in-process helper round-trips through the same channel", direct.ok === true && direct.value.clicked === null);

// A command for a target with no page reports no-page instead of hanging.
hostSocket.send(JSON.stringify({ type: "command", id: "cmd-none", action: "read" }));
const noPageHost = await openSocket(`role=host&target=t-missing&token=s3cret`, (socket, message) => hostSeen.push(message));
noPageHost.send(JSON.stringify({ type: "command", id: "cmd-missing", action: "read" }));
await new Promise((resolve) => setTimeout(resolve, 150));
check(
  "a command without a connected page answers no-page",
  hostSeen.some((message) => message.type === "result" && message.id === "cmd-missing" && message.error === "no-page")
);

// A page that never answers hits the bridge timeout.
pageSocket.send(JSON.stringify({ type: "result", id: "ignore-me", ok: true }));
const silentSocket = { write: () => true };
bridge.pages.set("t-silent", new Map([[silentSocket, { socket: silentSocket, url: "", title: "", since: Date.now() }]]));
const silent = await bridge.command("t-silent", { action: "read" }, 300);
check("a silent page times out instead of hanging", silent.ok === false && silent.error === "timeout");

// Several frames of one page (board card + canvas copy): the command reaches all of them
// and the first answer wins — this is what keeps a page from being evicted by its own copy.
const frames = [];
const secondPage = await openSocket(`role=page&target=${key}&token=s3cret`, (socket, message) => {
  if (message.type === "command") {
    frames.push("second:" + message.id);
    socket.send(JSON.stringify({ type: "result", id: message.id, ok: true, value: { clicked: "second" } }));
  }
});
const firstAgain = await openSocket(`role=page&target=${key}&token=s3cret`, (socket, message) => {
  if (message.type === "command") frames.push("first:" + message.id);
});
await new Promise((resolve) => setTimeout(resolve, 150));
const multi = await bridge.command(key, { action: "read" }, 800);
check(
  "several frames of one page coexist and a command reaches them",
  (bridge.pages.get(key)?.size ?? 0) === 3 && multi.ok === true && frames.length >= 2
);
firstAgain.close();
secondPage.close();
await new Promise((resolve) => setTimeout(resolve, 150));
check("closing one frame keeps the target alive", (bridge.pages.get(key)?.size ?? 0) === 1);

// The token gates the socket too.
let wsRejected = false;
try {
  await openSocket(`role=host&target=${key}`, () => {});
} catch {
  wsRejected = true;
}
check("the websocket requires the token", wsRejected === true);

check("a page disconnect is broadcast", await (async () => {
  pageSocket.close();
  await new Promise((resolve) => setTimeout(resolve, 200));
  return hostSeen.some((message) => message.type === "page" && message.state === "disconnected") && (bridge.pages.get(key)?.size ?? 0) === 0;
})());

// ---- allow-list and framing on a live bridge ----
const strict = startBridge({ port: 0, host: "127.0.0.1", allow: ["127.0.0.1"] });
await strict.ready;
const strictPort = strict.server.address().port;
const strictBase = `http://127.0.0.1:${strictPort}`;
check("the allow-list blocks other hosts", (await fetch(`${strictBase}/p?url=${encodeURIComponent("http://localhost:" + targetPort + "/")}`)).status === 403);
check("the allow-list lets its own hosts through", (await fetch(`${strictBase}/p?url=${encodeURIComponent(targetUrl)}`)).status === 200);
await strict.close();

hostSocket.close();
noPageHost.close();
await bridge.close();
targetServer.close();
console.log(failed === 0 ? "ALL PASS" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
