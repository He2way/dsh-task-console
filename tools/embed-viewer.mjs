// Embed the 3D model viewer into the single-file client bundle.
//
// viewer/viewer.html is a dependency-free WebGL glTF/GLB (+ OBJ/STL) viewer. It is gzipped
// and base64-encoded into lib/client.js so a canvas item can render it in a sandboxed
// iframe without any extra file, network request or CDN.
//
//   node tools/embed-viewer.mjs
//
// Idempotent: it rewrites the two payload constants in place.
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SOURCE = join(ROOT, "viewer", "viewer.html");
const BUNDLE = join(ROOT, "lib", "client.js");

const html = readFileSync(SOURCE);
const sha256 = createHash("sha256").update(html).digest("hex");
const gzip = gzipSync(html, { level: 9 });
const base64 = gzip.toString("base64");
if (!/^[A-Za-z0-9+/=]+$/.test(base64)) throw new Error("unexpected base64 payload");

let bundle = readFileSync(BUNDLE, "utf8");
const before = bundle.length;
const swap = (name, value) => {
  const pattern = new RegExp("(const " + name + " = )\"[^\"]*\";");
  if (!pattern.test(bundle)) throw new Error("anchor not found in lib/client.js: " + name);
  bundle = bundle.replace(pattern, (_match, head) => head + JSON.stringify(value) + ";");
};
swap("TASK_VIEWER_SHA256", sha256);
swap("TASK_VIEWER_GZIP_B64", base64);
writeFileSync(BUNDLE, bundle);

console.log("source    ", SOURCE, html.length + " bytes");
console.log("sha256    ", sha256);
console.log("gzip+b64  ", gzip.length + " -> " + base64.length + " chars");
console.log("bundle    ", before + " -> " + statSync(BUNDLE).size + " bytes");
