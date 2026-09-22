// A tiny glTF-binary cube, shared by the viewer checks.
//
// Both verification tools need a *real* model: one drives viewer/viewer.html directly,
// the other puts a model control on a canvas and waits for its embedded viewer to report
// what it loaded. Building it here keeps the two harnesses honest about the same bytes.
/**
 * One 1×1×1 cube: 24 vertices (4 per face, per-face normals), 12 triangles, one material.
 * @returns {Buffer} a complete .glb file.
 */
export function buildCubeGlb() {
  const faces = [
    { normal: [0, 0, 1], corners: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
    { normal: [0, 0, -1], corners: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
    { normal: [1, 0, 0], corners: [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]] },
    { normal: [-1, 0, 0], corners: [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]] },
    { normal: [0, 1, 0], corners: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
    { normal: [0, -1, 0], corners: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  ];
  const positions = [];
  const normals = [];
  const indices = [];
  faces.forEach((face, faceIndex) => {
    for (const corner of face.corners) {
      positions.push(corner[0] * 0.5, corner[1] * 0.5, corner[2] * 0.5);
      normals.push(face.normal[0], face.normal[1], face.normal[2]);
    }
    const base = faceIndex * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  const positionBytes = Buffer.from(new Float32Array(positions).buffer);
  const normalBytes = Buffer.from(new Float32Array(normals).buffer);
  const indexBytes = Buffer.from(new Uint16Array(indices).buffer);
  const bin = Buffer.concat([positionBytes, normalBytes, indexBytes]);
  const json = {
    asset: { version: "2.0", generator: "dsh-task-console viewer check" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: "cube" }],
    meshes: [{ name: "cube", primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [{ name: "cube", pbrMetallicRoughness: { baseColorFactor: [0.42, 0.55, 0.95, 1] } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length },
      { buffer: 0, byteOffset: positionBytes.length, byteLength: normalBytes.length },
      { buffer: 0, byteOffset: positionBytes.length + normalBytes.length, byteLength: indexBytes.length },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: positions.length / 3, type: "VEC3", min: [-0.5, -0.5, -0.5], max: [0.5, 0.5, 0.5] },
      { bufferView: 1, componentType: 5126, count: normals.length / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: indices.length, type: "SCALAR" },
    ],
  };
  const jsonText = Buffer.from(JSON.stringify(json), "utf8");
  const jsonPadding = (4 - (jsonText.length % 4)) % 4;
  const jsonChunk = Buffer.concat([jsonText, Buffer.alloc(jsonPadding, 0x20)]);
  const binPadding = (4 - (bin.length % 4)) % 4;
  const binChunk = Buffer.concat([bin, Buffer.alloc(binPadding, 0)]);
  const total = 12 + 8 + jsonChunk.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}
