// Decode meshopt bufferViews for read-only native Blender inspection; never export geometry.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const names = ['adult_male', 'vhf_denver_ct_adult_female']
function fail(message) { throw new Error(message) }
function integer(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) fail(`invalid ${name}`)
  return value
}
function sliceRange(buffer, offset, length, name) {
  integer(offset, `${name} offset`); integer(length, `${name} length`)
  if (offset > buffer.length || length > buffer.length - offset) fail(`${name} outside buffer`)
  return buffer.subarray(offset, offset + length)
}
function parseGlb(raw) {
  if (raw.length < 28 || raw.readUInt32LE(0) !== 0x46546c67 || raw.readUInt32LE(4) !== 2 || raw.readUInt32LE(8) !== raw.length) fail('invalid GLB header')
  const chunks = []
  for (let offset = 12; offset < raw.length;) {
    if (offset + 8 > raw.length) fail('truncated GLB chunk header')
    const length = raw.readUInt32LE(offset), type = raw.readUInt32LE(offset + 4)
    if (length % 4) fail('unaligned GLB chunk')
    chunks.push({ type, data: sliceRange(raw, offset + 8, length, 'chunk') }); offset += 8 + length
  }
  if (chunks.length !== 2 || chunks[0].type !== 0x4e4f534a || chunks[1].type !== 0x004e4942) fail('expected JSON followed by BIN chunk')
  const json = JSON.parse(chunks[0].data.toString('utf8').trim())
  if (!json.buffers?.length || json.buffers[0].uri || !Array.isArray(json.bufferViews)) fail('expected embedded GLB buffer')
  if (json.buffers.slice(1).some(buffer => buffer.uri || buffer.extensions?.EXT_meshopt_compression?.fallback !== true)) fail('unsupported extra buffer')
  const bin = sliceRange(chunks[1].data, 0, integer(json.buffers[0].byteLength, 'buffer length'), 'declared buffer')
  return { json, bin }
}
export async function decodeRig(raw) {
  const { json, bin } = parseGlb(raw)
  await MeshoptDecoder.ready
  const parts = []; let offset = 0
  for (const view of json.bufferViews) {
    const ext = view.extensions?.EXT_meshopt_compression
    let data
    if (ext) {
      if (ext.buffer !== 0) fail('external meshopt buffer unsupported')
      const count = integer(ext.count, 'meshopt count'), stride = integer(ext.byteStride, 'meshopt stride')
      if (!stride || count * stride !== view.byteLength) fail('meshopt decoded length mismatch')
      const compressed = sliceRange(bin, ext.byteOffset ?? 0, ext.byteLength, 'meshopt')
      data = new Uint8Array(count * stride)
      MeshoptDecoder.decodeGltfBuffer(data, count, stride, compressed, ext.mode, ext.filter)
      delete view.extensions.EXT_meshopt_compression
      if (!Object.keys(view.extensions).length) delete view.extensions
    } else {
      if (view.buffer !== 0) fail('external bufferView unsupported')
      data = sliceRange(bin, view.byteOffset ?? 0, view.byteLength, 'bufferView')
    }
    view.buffer = 0; view.byteOffset = offset; view.byteLength = data.length
    const padding = Buffer.alloc((4 - data.length % 4) % 4)
    parts.push(Buffer.from(data), padding); offset += data.length + padding.length
  }
  json.buffers = [{ byteLength: offset }]
  for (const key of ['extensionsUsed', 'extensionsRequired']) if (json[key]) json[key] = json[key].filter(value => value !== 'EXT_meshopt_compression')
  const encoded = Buffer.from(JSON.stringify(json)), jsonChunk = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]), binChunk = Buffer.concat(parts)
  const header = Buffer.alloc(20), binHeader = Buffer.alloc(8)
  header.writeUInt32LE(0x46546c67); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + jsonChunk.length + binChunk.length, 8)
  header.writeUInt32LE(jsonChunk.length, 12); header.writeUInt32LE(0x4e4f534a, 16)
  binHeader.writeUInt32LE(binChunk.length); binHeader.writeUInt32LE(0x004e4942, 4)
  return Buffer.concat([header, jsonChunk, binHeader, binChunk])
}
async function main() {
  const args = process.argv.slice(2)
  if (args.length !== 2 || args[0] !== '--decoded-dir') fail('usage: node scripts/qa/decode-rig-for-blender.mjs --decoded-dir DIRECTORY')
  fs.mkdirSync(args[1], { recursive: true })
  for (const name of names) {
    const source = fs.readFileSync(path.join(root, 'public/bodyexposure', `${name}.rig_rom.glb`))
    fs.writeFileSync(path.join(args[1], `${name}.decoded.glb`), await decodeRig(source))
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
