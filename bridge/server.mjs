#!/usr/bin/env node
/**
 * dsh-task-console page bridge — a zero-dependency proxy + control channel that
 * lets the workbench (and the agent behind it) operate a web page shown in a card.
 *
 * Why a proxy: a cross-origin iframe cannot be scripted by its parent, so an
 * embedded app is normally opaque to the plugin. The bridge serves the target
 * page itself (`GET /p?url=…`) and injects `bridge.js` into it; that script opens
 * a WebSocket back to the bridge and executes the commands the workbench sends
 * (`click`, `type`, `read`, `query`, `scroll`, …) inside the page, returning the
 * results. The plugin never gets script access to the page — the page itself
 * reports back through the bridge, which is exactly the trust boundary a browser
 * would otherwise enforce.
 *
 * Usage:
 *   node bridge/server.mjs [--port 8790] [--host 127.0.0.1] [--token <secret>]
 *                          [--allow example.com,*.internal] [--max-bytes 8000000]
 *
 * Workbench side:
 *   http://<host>:<port>/p?url=<encoded target>&target=<key>[&token=<secret>]
 *   ws://<host>:<port>/ws?role=host&target=<key>[&token=<secret>]     (commands)
 *   ws://<host>:<port>/ws?role=page&target=<key>[&token=<secret>]     (injected)
 *
 * Security: anything that can reach this server with the token can drive, and
 * read from, every page proxied through it — run it on loopback and keep the
 * token secret. `--allow` restricts which hosts may be proxied.
 */
import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const COMMAND_TIMEOUT_MS = 15000;

function parseArgs(argv) {
  const options = { port: 8790, host: "127.0.0.1", token: "", allow: [], maxBytes: 8000000, timeout: COMMAND_TIMEOUT_MS };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--port" && value !== void 0) { options.port = Number(value); index++; }
    else if (flag === "--host" && value !== void 0) { options.host = value; index++; }
    else if (flag === "--token" && value !== void 0) { options.token = value; index++; }
    else if (flag === "--allow" && value !== void 0) { options.allow = value.split(",").map((item) => item.trim()).filter((item) => item.length > 0); index++; }
    else if (flag === "--max-bytes" && value !== void 0) { options.maxBytes = Number(value); index++; }
    else if (flag === "--timeout" && value !== void 0) { options.timeout = Number(value); index++; }
  }
  return options;
}

/** Build one unmasked server→client text frame. */
export function textFrame(text) {
  const payload = Buffer.from(text, "utf8");
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  header[0] = 0x81;
  return Buffer.concat([header, payload]);
}

/** Build one masked client→server frame (used by the smoke test). */
export function maskedFrame(text) {
  const payload = Buffer.from(text, "utf8");
  const length = payload.length;
  const mask = Buffer.from([9, 8, 7, 6]);
  let header;
  if (length < 126) {
    header = Buffer.alloc(2);
    header[1] = 0x80 | length;
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[1] = 0x80 | 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  header[0] = 0x81;
  const masked = Buffer.alloc(length);
  for (let index = 0; index < length; index++) masked[index] = payload[index] ^ mask[index % 4];
  return Buffer.concat([header, mask, masked]);
}

/** Incremental frame reader: feed chunks, receive complete messages. */
export function createFrameReader(onMessage) {
  let buffer = Buffer.alloc(0);
  return (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    for (;;) {
      if (buffer.length < 2) return;
      const first = buffer[0];
      const second = buffer[1];
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (buffer.length < 4) return;
        length = buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (buffer.length < 10) return;
        length = Number(buffer.readBigUInt64BE(2));
        offset = 10;
      }
      if (masked) offset += 4;
      if (buffer.length < offset + length) return;
      const payload = Buffer.from(buffer.subarray(offset, offset + length));
      if (masked) {
        const mask = buffer.subarray(offset - 4, offset);
        for (let index = 0; index < payload.length; index++) payload[index] ^= mask[index % 4];
      }
      buffer = buffer.subarray(offset + length);
      if (opcode === 0x8) { onMessage({ kind: "close" }); return; }
      if (opcode === 0x9) { onMessage({ kind: "ping", payload }); continue; }
      if (opcode === 0xa) { onMessage({ kind: "pong" }); continue; }
      if (opcode === 0x1) { onMessage({ kind: "text", text: payload.toString("utf8") }); continue; }
      if (opcode === 0x2) { onMessage({ kind: "binary" }); continue; }
      onMessage({ kind: "unsupported", opcode });
      return;
    }
  };
}

/** True when `host` passes the optional allow-list (`example.com`, `*.internal`, `127.0.0.1:5173`). */
export function hostAllowed(host, allow) {
  if (!Array.isArray(allow) || allow.length === 0) return true;
  const name = String(host).toLowerCase();
  // "example.com:5173" also matches the bare "example.com" rule; a rule with a port is exact.
  const bare = name.includes(":") ? name.slice(0, name.lastIndexOf(":")) : name;
  return allow.some((pattern) => {
    const rule = pattern.toLowerCase();
    if (rule.startsWith("*.")) {
      const suffix = rule.slice(1);
      return name.endsWith(suffix) || bare.endsWith(suffix);
    }
    if (rule.includes(":")) return name === rule;
    return name === rule || bare === rule;
  });
}

/** Stable short key for one target URL (the workbench and the page must agree on it). */
export function targetKey(url) {
  return "t" + createHash("sha1").update(String(url)).digest("hex").slice(0, 12);
}

/** The in-page agent. Served at /bridge.js and injected into every proxied page. */
const BRIDGE_JS = `(function () {
  if (window.__dshPageBridge !== undefined) return;
  var script = document.currentScript;
  var params = new URLSearchParams(script !== null && script.src !== null ? script.src.split("?")[1] || "" : "");
  var target = params.get("target") || "";
  var token = params.get("token") || "";
  var state = { socket: null, connected: false, retry: 0, target: target, lastError: "" };
  window.__dshPageBridge = state;
  function visible(element) {
    if (element === null || element === undefined) return false;
    var box = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }
  function describe(element) {
    if (element === null || element === undefined) return null;
    return {
      tag: element.tagName.toLowerCase(),
      text: (element.innerText || element.value || element.getAttribute("aria-label") || "").replace(/\\s+/g, " ").trim().slice(0, 120),
      id: element.id || "",
      name: element.getAttribute("name") || "",
      type: element.getAttribute("type") || "",
      href: element.getAttribute("href") || ""
    };
  }
  function pick(action) {
    if (typeof action.selector === "string" && action.selector.length > 0) {
      var found = document.querySelector(action.selector);
      return { element: found, how: "selector" };
    }
    if (typeof action.text === "string" && action.text.length > 0) {
      var wanted = action.text.replace(/\\s+/g, " ").trim().toLowerCase();
      var candidates = document.querySelectorAll("button, a, input[type=submit], input[type=button], [role=button], label, li, td, span, div");
      var exact = null;
      var partial = null;
      for (var index = 0; index < candidates.length; index++) {
        var node = candidates[index];
        var text = (node.innerText || node.value || "").replace(/\\s+/g, " ").trim().toLowerCase();
        if (text.length === 0) continue;
        if (text === wanted && exact === null && visible(node)) exact = node;
        else if (partial === null && visible(node) && text.indexOf(wanted) !== -1) partial = node;
      }
      return { element: exact || partial, how: "text" };
    }
    return { element: null, how: "none" };
  }
  function setValue(element, value) {
    var proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, "value");
    if (setter !== undefined && setter.set !== undefined) setter.set.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function key(element, name) {
    var options = { key: name, code: name, bubbles: true, cancelable: true };
    element.dispatchEvent(new KeyboardEvent("keydown", options));
    element.dispatchEvent(new KeyboardEvent("keypress", options));
    element.dispatchEvent(new KeyboardEvent("keyup", options));
  }
  async function act(action) {
    var kind = action.action;
    if (kind === "read") {
      var scope = typeof action.selector === "string" && action.selector.length > 0 ? document.querySelector(action.selector) : document.body;
      if (scope === null) return { ok: false, error: "no-match" };
      var fields = [];
      var inputs = document.querySelectorAll("input, textarea, select");
      for (var index = 0; index < inputs.length && fields.length < 40; index++) {
        var input = inputs[index];
        if (!visible(input)) continue;
        fields.push({ selector: input.id ? "#" + input.id : input.name ? "[name=" + input.name + "]" : input.tagName.toLowerCase(), type: input.getAttribute("type") || input.tagName.toLowerCase(), value: String(input.value || "").slice(0, 80), placeholder: input.getAttribute("placeholder") || "" });
      }
      return { ok: true, value: { url: location.href, title: document.title, text: (scope.innerText || "").replace(/\\n{3,}/g, "\\n\\n").slice(0, 6000), fields: fields } };
    }
    if (kind === "query") {
      var nodes = document.querySelectorAll(action.selector);
      var items = [];
      for (var nodeIndex = 0; nodeIndex < nodes.length && items.length < 20; nodeIndex++) items.push(describe(nodes[nodeIndex]));
      return { ok: true, value: { count: nodes.length, items: items } };
    }
    if (kind === "click") {
      var picked = pick(action);
      if (picked.element === null || picked.element === undefined) return { ok: false, error: "no-match" };
      picked.element.scrollIntoView({ block: "center", behavior: "instant" });
      var box = picked.element.getBoundingClientRect();
      var point = { bubbles: true, cancelable: true, clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
      try {
        picked.element.dispatchEvent(new PointerEvent("pointerdown", point));
        picked.element.dispatchEvent(new MouseEvent("mousedown", point));
        picked.element.dispatchEvent(new PointerEvent("pointerup", point));
        picked.element.dispatchEvent(new MouseEvent("mouseup", point));
      } catch (error) { /* older engines: the click below still fires handlers */ }
      picked.element.click();
      return { ok: true, value: { how: picked.how, clicked: describe(picked.element) } };
    }
    if (kind === "type") {
      var field = document.querySelector(action.selector);
      if (field === null || field === undefined) return { ok: false, error: "no-match" };
      field.focus();
      setValue(field, String(action.value === undefined ? "" : action.value));
      if (action.submit === true) {
        key(field, "Enter");
        var form = field.form;
        if (form !== null && form !== undefined && typeof form.requestSubmit === "function") form.requestSubmit();
      }
      return { ok: true, value: { typed: String(action.value === undefined ? "" : action.value).slice(0, 200), into: describe(field) } };
    }
    if (kind === "press") {
      var pressTarget = typeof action.selector === "string" && action.selector.length > 0 ? document.querySelector(action.selector) : document.activeElement || document.body;
      if (pressTarget === null || pressTarget === undefined) return { ok: false, error: "no-match" };
      key(pressTarget, String(action.key || "Enter"));
      return { ok: true, value: { pressed: String(action.key || "Enter") } };
    }
    if (kind === "select") {
      var select = document.querySelector(action.selector);
      if (select === null || select === undefined) return { ok: false, error: "no-match" };
      var wanted = action.value !== undefined ? String(action.value) : "";
      var matched = false;
      for (var optionIndex = 0; optionIndex < select.options.length; optionIndex++) {
        var option = select.options[optionIndex];
        if ((action.label !== undefined && option.text.trim() === String(action.label)) || (action.value !== undefined && option.value === wanted)) {
          select.selectedIndex = optionIndex;
          matched = true;
          break;
        }
      }
      if (!matched) return { ok: false, error: "no-option" };
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, value: { selected: select.value } };
    }
    if (kind === "check") {
      var box2 = document.querySelector(action.selector);
      if (box2 === null || box2 === undefined) return { ok: false, error: "no-match" };
      var want = action.checked !== false;
      if (box2.checked !== want) box2.click();
      return { ok: true, value: { checked: box2.checked } };
    }
    if (kind === "scroll") {
      if (typeof action.selector === "string" && action.selector.length > 0) {
        var into = document.querySelector(action.selector);
        if (into === null) return { ok: false, error: "no-match" };
        into.scrollIntoView({ block: "center", behavior: "instant" });
        return { ok: true, value: { scrolledTo: describe(into) } };
      }
      var y = action.bottom === true ? document.body.scrollHeight : Number(action.y || 0);
      window.scrollTo(0, y);
      return { ok: true, value: { scrollY: window.scrollY } };
    }
    if (kind === "wait") {
      var deadline = Date.now() + Math.min(Number(action.timeout || 8000), 15000);
      if (typeof action.selector === "string" && action.selector.length > 0) {
        while (Date.now() < deadline) {
          if (document.querySelector(action.selector) !== null) return { ok: true, value: { appeared: action.selector } };
          await new Promise(function (resolve) { setTimeout(resolve, 120); });
        }
        return { ok: false, error: "timeout" };
      }
      await new Promise(function (resolve) { setTimeout(resolve, Math.min(Number(action.ms || 500), 15000)); });
      return { ok: true, value: { waited: true } };
    }
    if (kind === "eval") {
      try {
        var value = await (0, eval)("(" + String(action.code || "") + ")");
        return { ok: true, value: JSON.parse(JSON.stringify(value === undefined ? null : value)) };
      } catch (error) {
        return { ok: false, error: String(error && error.message ? error.message : error).slice(0, 300) };
      }
    }
    if (kind === "back" || kind === "forward") { if (kind === "back") history.back(); else history.forward(); return { ok: true, value: { moved: kind } }; }
    if (kind === "reload") { location.reload(); return { ok: true, value: { reloaded: true } }; }
    return { ok: false, error: "unsupported-action:" + String(kind) };
  }
  function send(message) {
    if (state.socket === null || state.socket.readyState !== 1) return false;
    state.socket.send(JSON.stringify(message));
    return true;
  }
  async function onCommand(message) {
    var result;
    try {
      result = await act(message);
    } catch (error) {
      result = { ok: false, error: String(error && error.message ? error.message : error).slice(0, 300) };
    }
    send({ type: "result", id: message.id, ok: result.ok === true, value: result.value === undefined ? null : result.value, error: result.error === undefined ? null : result.error });
  }
  function connect() {
    var scheme = location.protocol === "https:" ? "wss://" : "ws://";
    var query = "role=page&target=" + encodeURIComponent(target) + (token.length > 0 ? "&token=" + encodeURIComponent(token) : "");
    var socket;
    try { socket = new WebSocket(scheme + location.host + "/ws?" + query); } catch (error) { state.lastError = String(error); return; }
    state.socket = socket;
    socket.onopen = function () {
      state.connected = true;
      state.retry = 0;
      send({ type: "hello", target: target, url: location.href, title: document.title });
    };
    socket.onmessage = function (event) {
      var message = null;
      try { message = JSON.parse(String(event.data)); } catch (error) { return; }
      if (message === null || typeof message !== "object") return;
      if (message.type === "command") void onCommand(message);
    };
    socket.onclose = function () {
      state.connected = false;
      state.retry = Math.min(state.retry + 1, 6);
      setTimeout(connect, 400 * state.retry);
    };
    socket.onerror = function () { state.lastError = "socket-error"; };
  }
  connect();
  document.addEventListener("dsh-task-console:page-action", function (event) {
    var detail = event !== null && event.detail !== null && typeof event.detail === "object" ? event.detail : {};
    void onCommand({ id: String(detail.id || "manual"), action: detail.action, selector: detail.selector, text: detail.text, value: detail.value });
  });
})();
`;

/**
 * Start the bridge.
 * @param options - `{ port, host, token, allow, maxBytes, timeout }`.
 * @returns `{ server, targets, close, ready, command }` — server, target table, closer, readiness promise and a direct in-process command helper (used by the smoke test).
 */
export function startBridge(options) {
  const settings = { port: 8790, host: "127.0.0.1", token: "", allow: [], maxBytes: 8000000, timeout: COMMAND_TIMEOUT_MS, ...options };
  /**
   * target key → Map<socket, page>. Several frames can show the same URL at once (a board
   * card and the same control on a canvas, or the fullscreen copy), so a target keeps every
   * live page socket; a command is broadcast to all of them and the first answer wins.
   */
  const pages = new Map();
  /** host socket → { socket, target, pending: Map<id, {resolve, timer}> } */
  const hosts = new Set();

  const pageSockets = (target) => pages.get(target) ?? new Map();
  const pageCount = (target) => pageSockets(target).size;
  const firstPage = (target) => {
    for (const page of pageSockets(target).values()) return page;
    return void 0;
  };

  const send = (socket, message) => {
    try { socket.write(textFrame(JSON.stringify(message))); } catch { /* the socket closes itself */ }
  };
  const notifyHosts = (target, message) => {
    for (const host of hosts) {
      if (host.target === target) send(host.socket, message);
    }
  };
  const settle = (host, id, result) => {
    const pending = host.pending.get(id);
    if (pending === undefined) return;
    clearTimeout(pending.timer);
    host.pending.delete(id);
    pending.resolve(result);
  };

  /** id → { target, timer, resolve } for commands that went through `command()`. */
  const pendingCommands = new Map();
  /**
   * Run one command against a connected page and resolve with its result — the
   * in-process entry point (the workbench normally uses the `host` WebSocket role).
   */
  function command(target, action, timeoutMs) {
    return new Promise((resolve) => {
      const sockets = [...pageSockets(target).keys()];
      if (sockets.length === 0) { resolve({ ok: false, error: "no-page", value: null }); return; }
      const id = randomUUID();
      const timer = setTimeout(() => {
        const pending = pendingCommands.get(id);
        if (pending !== undefined) {
          pendingCommands.delete(id);
          pending.resolve({ ok: false, error: "timeout", value: null });
        }
        for (const host of hosts) {
          if (host.target === target) settle(host, id, { ok: false, error: "timeout", value: null });
        }
      }, typeof timeoutMs === "number" && timeoutMs > 0 ? timeoutMs : settings.timeout);
      pendingCommands.set(id, { target, timer, resolve });
      // Every frame showing this page gets the command; the first result settles it.
      for (const socket of sockets) send(socket, { type: "command", id, ...action });
    });
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://bridge");
    const token = url.searchParams.get("token") ?? "";
    const unauthorized = settings.token.length > 0 && token !== settings.token;
    const plain = (status, text) => {
      response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
      response.end(text);
    };
    if (url.pathname === "/healthz") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        ok: true,
        pages: [...pages.entries()].map(([target, sockets]) => {
          const first = firstPage(target);
          return { target, frames: sockets.size, url: first?.url ?? "", title: first?.title ?? "", since: first?.since ?? 0 };
        }),
        hosts: hosts.size
      }));
      return;
    }
    if (url.pathname === "/bridge.js") {
      response.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" });
      response.end(BRIDGE_JS);
      return;
    }
    if (url.pathname === "/p") {
      if (unauthorized) { plain(403, "forbidden"); return; }
      const target = url.searchParams.get("url") ?? "";
      let parsed = null;
      try { parsed = new URL(target); } catch { parsed = null; }
      if (parsed === null || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) { plain(400, "url must be an absolute http(s) URL"); return; }
      if (!hostAllowed(parsed.host, settings.allow)) { plain(403, "host not allowed"); return; }
      const key = url.searchParams.get("target") ?? targetKey(parsed.href);
      let upstream = null;
      try {
        upstream = await fetch(parsed.href, {
          redirect: "follow",
          headers: { "user-agent": "dsh-task-console-bridge/1.0", accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8" }
        });
      } catch (error) {
        plain(502, "upstream fetch failed: " + String(error !== null && typeof error === "object" && error.message ? error.message : error));
        return;
      }
      const type = upstream.headers.get("content-type") ?? "application/octet-stream";
      const buffer = Buffer.from(await upstream.arrayBuffer());
      if (buffer.length > settings.maxBytes) { plain(502, "response too large"); return; }
      const headers = { "content-type": type, "cache-control": "no-store" };
      if (type.includes("text/html")) {
        let html = buffer.toString("utf8");
        const injected = `<script src="/bridge.js?target=${encodeURIComponent(key)}${settings.token.length > 0 ? `&token=${encodeURIComponent(settings.token)}` : ""}"></script>`;
        if (html.includes("</body>")) html = html.replace("</body>", injected + "</body>");
        else html += injected;
        response.writeHead(upstream.status, headers);
        response.end(html);
        return;
      }
      response.writeHead(upstream.status, headers);
      response.end(buffer);
      return;
    }
    if (url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>dsh-task-console page bridge</title></head><body style="font:14px/1.6 system-ui;padding:24px">
<h1>dsh-task-console page bridge</h1>
<p>Proxy a page and let the workbench drive it: <code>/p?url=&lt;encoded&gt;&amp;target=&lt;key&gt;</code>${settings.token.length > 0 ? " with <code>&amp;token=…</code>" : ""}</p>
<p>Connected pages: ${pages.size} target(s) · workbench clients: ${hosts.size}</p>
<ul>${[...pages.entries()].map(([key, sockets]) => { const first = firstPage(key); return `<li><code>${key}</code> — ${sockets.size} frame(s) · ${first?.title || first?.url || ""}</li>`; }).join("") || "<li>none yet</li>"}</ul>
</body></html>`);
      return;
    }
    plain(404, "dsh-task-console page bridge\n");
  });

  server.on("upgrade", (request, socket) => {
    const url = new URL(request.url ?? "/", "http://bridge");
    const role = url.searchParams.get("role") ?? "";
    const target = (url.searchParams.get("target") ?? "").slice(0, 64);
    const token = url.searchParams.get("token") ?? "";
    const reject = (status, message) => {
      socket.write(`HTTP/1.1 ${status} ${message}\r\nconnection: close\r\n\r\n`);
      socket.destroy();
    };
    if (settings.token.length > 0 && token !== settings.token) { reject(403, "Forbidden"); return; }
    if (target.length === 0 || (role !== "page" && role !== "host")) { reject(400, "Bad Request"); return; }
    const key = request.headers["sec-websocket-key"];
    if (typeof key !== "string") { reject(400, "Bad Request"); return; }
    const accept = createHash("sha1").update(key + GUID).digest("base64");
    socket.write([
      "HTTP/1.1 101 Switching Protocols",
      "upgrade: websocket",
      "connection: Upgrade",
      `sec-websocket-accept: ${accept}`,
      "\r\n"
    ].join("\r\n"));

    if (role === "page") {
      // Several frames can show the same URL; keep them all and never evict a live one.
      const sockets = pages.get(target) ?? new Map();
      pages.set(target, sockets);
      const page = { socket, url: "", title: "", since: Date.now() };
      sockets.set(socket, page);
      notifyHosts(target, { type: "page", state: "connected", target, frames: sockets.size });
      const read = createFrameReader((frame) => {
        if (frame.kind === "close") { socket.end(); return; }
        if (frame.kind !== "text") return;
        let message = null;
        try { message = JSON.parse(frame.text); } catch { return; }
        if (message === null || typeof message !== "object") return;
        if (message.type === "hello") {
          page.url = typeof message.url === "string" ? message.url.slice(0, 500) : "";
          page.title = typeof message.title === "string" ? message.title.slice(0, 200) : "";
          notifyHosts(target, { type: "page", state: "connected", target, url: page.url, title: page.title, frames: sockets.size });
          return;
        }
        if (message.type === "result" && typeof message.id === "string") {
          const result = { ok: message.ok === true, value: message.value === undefined ? null : message.value, error: message.error === undefined ? null : message.error };
          const pending = pendingCommands.get(message.id);
          if (pending !== undefined) {
            clearTimeout(pending.timer);
            pendingCommands.delete(message.id);
            pending.resolve(result);
          }
          for (const host of hosts) {
            if (host.target === target) settle(host, message.id, result);
          }
        }
      });
      socket.on("data", read);
      socket.on("error", () => { /* closed below */ });
      socket.on("close", () => {
        sockets.delete(socket);
        if (sockets.size === 0) {
          pages.delete(target);
          notifyHosts(target, { type: "page", state: "disconnected", target });
        } else {
          notifyHosts(target, { type: "page", state: "connected", target, frames: sockets.size });
        }
      });
      return;
    }

    const host = { socket, target, pending: new Map() };
    hosts.add(host);
    const read = createFrameReader((frame) => {
      if (frame.kind === "close") { socket.end(); return; }
      if (frame.kind !== "text") return;
      let message = null;
      try { message = JSON.parse(frame.text); } catch { return; }
      if (message === null || typeof message !== "object") return;
      if (message.type === "ping") { send(socket, { type: "pong" }); return; }
      if (message.type === "status") {
        send(socket, { type: "page", state: pageCount(target) > 0 ? "connected" : "disconnected", target, frames: pageCount(target) });
        return;
      }
      if (message.type !== "command") return;
      const id = typeof message.id === "string" && message.id.length > 0 ? message.id : randomUUID();
      const sockets = [...pageSockets(target).keys()];
      if (sockets.length === 0) { send(socket, { type: "result", id, ok: false, error: "no-page", value: null }); return; }
      const timer = setTimeout(() => settle(host, id, { ok: false, error: "timeout", value: null }), settings.timeout);
      host.pending.set(id, { resolve: (result) => send(socket, { type: "result", id, ...result }), timer });
      const action = { ...message };
      delete action.type;
      delete action.id;
      for (const pageSocket of sockets) send(pageSocket, { type: "command", id, ...action });
    });
    socket.on("data", read);
    socket.on("error", () => { /* closed below */ });
    socket.on("close", () => {
      hosts.delete(host);
      for (const [, pending] of host.pending) clearTimeout(pending.timer);
      host.pending.clear();
    });
  });

  server.listen(settings.port, settings.host);
  const ready = new Promise((resolve) => {
    if (server.listening) { resolve(); return; }
    server.once("listening", () => resolve());
  });
  return {
    server,
    pages,
    hosts,
    ready,
    command: (target, action, timeoutMs) => command(target, action, timeoutMs),
    close: () => new Promise((resolve) => {
      for (const host of hosts) {
        try { host.socket.destroy(); } catch { /* already gone */ }
      }
      for (const sockets of pages.values()) {
        for (const page of sockets.values()) {
          try { page.socket.destroy(); } catch { /* already gone */ }
        }
      }
      for (const [, pending] of pendingCommands) clearTimeout(pending.timer);
      pendingCommands.clear();
      server.close(() => resolve());
    })
  };
}

const invokedDirectly = process.argv[1] !== void 0 && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;
if (invokedDirectly) {
  const options = parseArgs(process.argv.slice(2));
  const bridge = startBridge(options);
  await bridge.ready;
  const address = bridge.server.address();
  const port = address !== null && typeof address === "object" ? address.port : options.port;
  console.log(`dsh-task-console page bridge on http://${options.host}:${port}${options.token.length > 0 ? " (token required)" : ""}`);
  console.log(`  proxy a page:  http://${options.host}:${port}/p?url=<encoded>${options.token.length > 0 ? "&token=" + options.token : ""}`);
  console.log(`  health:        http://${options.host}:${port}/healthz`);
  const stop = () => { void bridge.close().then(() => process.exit(0)); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
