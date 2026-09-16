/**
 * Relay smoke test: boots relay/server.mjs on an ephemeral port and drives two
 * hand-rolled WebSocket clients through the real protocol (handshake, masked
 * frames, snapshot exchange, op broadcast, presence).
 *
 * Run: node relay/smoke.mjs   (or: npm run test:relay)
 */
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFrameReader, maskedFrame, startRelay } from "./server.mjs";

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
let failed = 0;
const check = (name, ok) => {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed += 1;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Minimal WebSocket client over the relay's own framing helpers. */
function connect(port, canvasId, token) {
  return new Promise((resolve, reject) => {
    const key = randomBytes(16).toString("base64");
    const path = `/?canvas=${encodeURIComponent(canvasId)}${token !== void 0 ? `&token=${encodeURIComponent(token)}` : ""}`;
    const req = request({ host: "127.0.0.1", port, path, headers: {
      connection: "Upgrade",
      upgrade: "websocket",
      "sec-websocket-key": key,
      "sec-websocket-version": "13"
    } });
    req.on("upgrade", (response, socket, head) => {
      const expected = createHash("sha1").update(key + GUID).digest("base64");
      if (response.headers["sec-websocket-accept"] !== expected) { reject(new Error("bad accept header")); return; }
      const messages = [];
      const listeners = new Set();
      const read = createFrameReader((frame) => {
        if (frame.kind === "ping") { socket.write(Buffer.from([0x8a, 0x00])); return; }
        if (frame.kind !== "text") return;
        let parsed = null;
        try { parsed = JSON.parse(frame.text); } catch { return; }
        messages.push(parsed);
        for (const listener of [...listeners]) listener(parsed);
      });
      socket.on("data", read);
      // Bytes that arrived in the same packet as the 101 handshake (a snapshot
      // can be written immediately after the upgrade) must not be dropped.
      if (head !== void 0 && head.length > 0) read(head);
      resolve({
        socket,
        messages,
        send: (message) => socket.write(maskedFrame(JSON.stringify(message))),
        onMessage: (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
        close: () => socket.destroy()
      });
    });
    req.on("response", (response) => reject(new Error("handshake rejected: " + response.statusCode)));
    req.on("error", reject);
    req.end();
  });
}

const dataDir = mkdtempSync(join(tmpdir(), "dsh-canvas-relay-"));
const relay = startRelay({ port: 0, host: "127.0.0.1", data: dataDir, token: "secret" });
await relay.ready;
const info = relay.address();
const port = info !== null && typeof info === "object" ? info.port : 0;

try {
  const alice = await connect(port, "canvas-1", "secret");
  alice.send({ type: "hello", clientId: "alice", name: "Alice" });
  alice.send({ type: "op", op: { kind: "canvas.snapshot", canvas: { id: "canvas-1", name: "团队画布", updatedAt: 1000, cards: { a1: { id: "a1", title: "Alice 的卡", x: 1, y: 2, updatedAt: 1000, rev: "alice:1", blocks: [{ kind: "text", text: "hi" }] } } } } });
  await sleep(120);

  const bob = await connect(port, "canvas-1", "secret");
  bob.send({ type: "hello", clientId: "bob", name: "Bob" });
  await sleep(160);

  const snapshot = bob.messages.find((message) => message.type === "snapshot");
  check("joining client receives the room snapshot", snapshot !== void 0 && snapshot.canvas.cards.a1.title === "Alice 的卡");

  const peers = bob.messages.filter((message) => message.type === "peers").pop();
  check("presence lists both participants", peers !== void 0 && peers.peers.length === 2 && peers.peers.some((peer) => peer.name === "Bob"));

  bob.send({ type: "op", op: { kind: "card.upsert", canvasId: "canvas-1", card: { id: "b1", title: "Bob 的卡", x: 40, y: 40, updatedAt: 2000, rev: "bob:1", blocks: [{ kind: "text", text: "from bob" }] } } });
  await sleep(160);
  const relayed = alice.messages.find((message) => message.type === "op" && message.op !== void 0 && message.op.kind === "card.upsert");
  check("ops are broadcast to the other participant", relayed !== void 0 && relayed.op.card.id === "b1" && relayed.from === "bob");

  const room = relay.rooms.get("canvas-1");
  check("relay keeps a merged canonical snapshot", room !== void 0 && room.canvas !== null && room.canvas.cards.b1 !== void 0 && room.canvas.cards.a1 !== void 0);

  let rejected = false;
  try {
    await connect(port, "canvas-1", "wrong-token");
  } catch {
    rejected = true;
  }
  check("a wrong token is rejected", rejected);

  let health = "";
  await new Promise((resolve) => {
    const req = request({ host: "127.0.0.1", port, path: "/healthz" }, (response) => {
      response.on("data", (chunk) => { health += chunk; });
      response.on("end", resolve);
    });
    req.end();
  });
  check("healthz reports the room", health.includes("\"ok\":true") && health.includes("\"rooms\":1"));

  alice.close();
  bob.close();
} finally {
  await relay.close();
  rmSync(dataDir, { recursive: true, force: true });
}

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
