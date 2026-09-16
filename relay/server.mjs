#!/usr/bin/env node
/**
 * dsh-task-canvas relay — a zero-dependency WebSocket relay for the
 * dsh-task-console infinite canvas.
 *
 * Rooms are keyed by canvas id. A room keeps the latest canonical canvas
 * snapshot (cards merged last-writer-wins by `updatedAt`, then `rev`) and
 * broadcasts every accepted op to the other participants, so several DSH
 * installations can edit one canvas together.
 *
 * Usage:
 *   node relay/server.mjs [--port 8787] [--host 0.0.0.0] [--data ./relay-data]
 *                         [--token <shared-secret>] [--max-bytes 1000000]
 *
 * Clients connect to `ws://<host>:<port>/?canvas=<id>&token=<token>`.
 * Security: the token is a bearer secret — anyone holding it can edit every
 * canvas on this relay. Run it behind TLS (`wss://`) and a firewall/proxy when
 * it is reachable from the internet.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function parseArgs(argv) {
  const options = { port: 8787, host: "0.0.0.0", data: "relay-data", token: "", maxBytes: 1000000 };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === "--port" && value !== void 0) { options.port = Number(value); index++; }
    else if (flag === "--host" && value !== void 0) { options.host = value; index++; }
    else if (flag === "--data" && value !== void 0) { options.data = value; index++; }
    else if (flag === "--token" && value !== void 0) { options.token = value; index++; }
    else if (flag === "--max-bytes" && value !== void 0) { options.maxBytes = Number(value); index++; }
  }
  return options;
}

/** Build one unmasked server→client text frame. */
function textFrame(text) {
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
  const mask = Buffer.from([1, 2, 3, 4]);
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

/** Incremental frame reader: feed chunks, receive complete text messages. */
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

/**
 * Start the relay.
 * @param options - `{ port, host, data, token, maxBytes }`.
 * @returns `{ server, rooms, close }` — the listening server plus a closer.
 */
export function startRelay(options) {
  const settings = { port: 8787, host: "0.0.0.0", data: "relay-data", token: "", maxBytes: 1000000, ...options };
  if (!existsSync(settings.data)) mkdirSync(settings.data, { recursive: true });
  const rooms = new Map();
  const clients = new Set();

  function roomFile(canvasId) {
    return join(settings.data, encodeURIComponent(canvasId) + ".json");
  }
  function loadRoom(canvasId) {
    let room = rooms.get(canvasId);
    if (room !== void 0) return room;
    let canvas = null;
    const file = roomFile(canvasId);
    try {
      if (existsSync(file)) canvas = JSON.parse(readFileSync(file, "utf8"));
    } catch { canvas = null; }
    room = { canvas, members: new Set(), saveTimer: null };
    rooms.set(canvasId, room);
    return room;
  }
  function saveRoom(canvasId, room) {
    if (room.saveTimer !== null) return;
    room.saveTimer = setTimeout(() => {
      room.saveTimer = null;
      try {
        writeFileSync(roomFile(canvasId), JSON.stringify(room.canvas ?? null));
      } catch { /* persistence is best-effort */ }
    }, 800);
  }
  function newerCard(left, right) {
    if (left === void 0 || left === null) return right;
    if (right === void 0 || right === null) return left;
    const a = typeof left.updatedAt === "number" ? left.updatedAt : 0;
    const b = typeof right.updatedAt === "number" ? right.updatedAt : 0;
    if (a !== b) return a > b ? left : right;
    return String(left.rev ?? "") >= String(right.rev ?? "") ? left : right;
  }
  function mergeSnapshot(canvasId, incoming) {
    const room = loadRoom(canvasId);
    if (incoming === null || typeof incoming !== "object") return room.canvas;
    const current = room.canvas;
    const cards = current !== null && typeof current === "object" && current.cards !== null && typeof current.cards === "object" ? { ...current.cards } : {};
    const incomingCards = incoming.cards !== null && typeof incoming.cards === "object" ? incoming.cards : {};
    for (const [id, card] of Object.entries(incomingCards)) cards[id] = newerCard(cards[id], card);
    const keepName = current !== null && typeof current === "object" && typeof current.name === "string" && (typeof incoming.updatedAt !== "number" || (typeof current.updatedAt === "number" && current.updatedAt > incoming.updatedAt));
    room.canvas = {
      id: canvasId,
      name: keepName ? current.name : (typeof incoming.name === "string" ? incoming.name : "未命名画布"),
      updatedAt: Math.max(typeof current?.updatedAt === "number" ? current.updatedAt : 0, typeof incoming.updatedAt === "number" ? incoming.updatedAt : 0),
      cards
    };
    saveRoom(canvasId, room);
    return room.canvas;
  }
  function applyOp(canvasId, op) {
    const room = loadRoom(canvasId);
    if (op === null || typeof op !== "object" || typeof op.kind !== "string") return null;
    if (op.kind === "canvas.snapshot") { mergeSnapshot(canvasId, op.canvas ?? null); return op; }
    if (room.canvas === null) room.canvas = { id: canvasId, name: "未命名画布", updatedAt: Date.now(), cards: {} };
    if (op.kind === "card.upsert" && op.card !== void 0 && op.card !== null && typeof op.card.id === "string") {
      room.canvas.cards = room.canvas.cards ?? {};
      room.canvas.cards[op.card.id] = newerCard(room.canvas.cards[op.card.id], op.card);
      room.canvas.updatedAt = Date.now();
      saveRoom(canvasId, room);
      return op;
    }
    if (op.kind === "card.delete" && typeof op.cardId === "string") {
      if (room.canvas.cards !== void 0) delete room.canvas.cards[op.cardId];
      room.canvas.updatedAt = Date.now();
      saveRoom(canvasId, room);
      return op;
    }
    if (op.kind === "canvas.rename" && typeof op.name === "string") {
      room.canvas.name = op.name.slice(0, 40);
      room.canvas.updatedAt = Date.now();
      saveRoom(canvasId, room);
      return op;
    }
    return null;
  }
  function peers(room) {
    return [...room.members].map((client) => ({ id: client.clientId, name: client.name }));
  }
  function broadcast(room, message, except) {
    const frame = textFrame(JSON.stringify(message));
    for (const client of room.members) {
      if (client === except) continue;
      try { client.socket.write(frame); } catch { /* the socket will close itself */ }
    }
  }
  function publishPeers(room) {
    const list = peers(room);
    broadcast(room, { type: "peers", peers: list }, null);
  }

  const server = createServer((request, response) => {
    if (request.url !== void 0 && request.url.startsWith("/healthz")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, rooms: rooms.size, clients: clients.size }));
      return;
    }
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("dsh-task-canvas relay\n");
  });

  server.on("upgrade", (request, socket) => {
    const url = new URL(request.url ?? "/", "http://relay");
    const canvasId = (url.searchParams.get("canvas") ?? "").slice(0, 64);
    const token = url.searchParams.get("token") ?? "";
    const reject = (status, message) => {
      socket.write(`HTTP/1.1 ${status} ${message}\r\nconnection: close\r\n\r\n`);
      socket.destroy();
    };
    if (canvasId.length === 0) { reject(400, "Bad Request"); return; }
    if (settings.token.length > 0 && token !== settings.token) { reject(403, "Forbidden"); return; }
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
    const client = { socket, canvasId, clientId: "c" + Math.random().toString(36).slice(2, 8), name: "匿名", alive: true, room: null };
    clients.add(client);
    const room = loadRoom(canvasId);
    room.members.add(client);
    client.room = room;
    if (room.canvas !== null) {
      try { socket.write(textFrame(JSON.stringify({ type: "snapshot", canvas: room.canvas }))); } catch { /* closing */ }
    }
    publishPeers(room);
    const read = createFrameReader((frame) => {
      if (frame.kind === "close") { socket.end(); return; }
      if (frame.kind === "ping") { try { socket.write(Buffer.from([0x8a, frame.payload.length & 0x7f])); } catch { /* closing */ } return; }
      if (frame.kind !== "text") return;
      if (frame.text.length > settings.maxBytes) { socket.destroy(); return; }
      let message = null;
      try { message = JSON.parse(frame.text); } catch { return; }
      if (message === null || typeof message !== "object") return;
      if (message.type === "hello") {
        if (typeof message.clientId === "string" && message.clientId.length > 0) client.clientId = message.clientId.slice(0, 32);
        if (typeof message.name === "string" && message.name.length > 0) client.name = message.name.slice(0, 24);
        publishPeers(room);
        return;
      }
      if (message.type === "op") {
        const accepted = applyOp(canvasId, message.op ?? null);
        if (accepted !== null) broadcast(room, { type: "op", op: accepted, from: client.clientId }, client);
      }
    });
    socket.on("data", read);
    socket.on("error", () => { /* closed below */ });
    socket.on("close", () => {
      clients.delete(client);
      room.members.delete(client);
      publishPeers(room);
    });
  });

  const heartbeat = setInterval(() => {
    for (const client of clients) {
      if (!client.alive) { client.socket.destroy(); continue; }
      client.alive = false;
      try { client.socket.write(Buffer.from([0x89, 0x00])); } catch { /* closing */ }
    }
  }, 30000);
  server.on("close", () => clearInterval(heartbeat));
  server.listen(settings.port, settings.host);
  const ready = new Promise((resolve) => {
    if (server.listening) { resolve(); return; }
    server.once("listening", () => resolve());
  });
  return {
    server,
    rooms,
    ready,
    address: () => server.address(),
    close: () => new Promise((resolve) => {
      clearInterval(heartbeat);
      for (const client of clients) { try { client.socket.destroy(); } catch { /* already gone */ } }
      server.close(() => resolve());
    })
  };
}

const invokedDirectly = process.argv[1] !== void 0 && import.meta.url === new URL("file://" + process.argv[1].replace(/\\/g, "/")).href;
if (invokedDirectly) {
  const settings = parseArgs(process.argv.slice(2));
  const relay = startRelay(settings);
  void relay.ready.then(() => {
    const info = relay.address();
    const port = info !== null && typeof info === "object" ? info.port : settings.port;
    console.log(`[dsh-task-canvas relay] listening on ws://${settings.host}:${port}/?canvas=<id>`);
    if (settings.token.length > 0) console.log("[dsh-task-canvas relay] token required (?token=…)");
    console.log(`[dsh-task-canvas relay] snapshots under ${settings.data}`);
  });
  const shutdown = () => { void relay.close().then(() => process.exit(0)); };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
