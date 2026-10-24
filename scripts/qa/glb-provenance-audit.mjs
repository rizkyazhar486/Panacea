// Audit independen D8: tiap struktur bernama di setiap GLB publik membawa sumber, lisensi, dan status akurasi
// (extras glTF), dan tiap kelas lisensinya punya catatan sumber primer (governance/LICENCE_PRIMARY_SOURCES.json).
// Pakai: node scripts/qa/glb-provenance-audit.mjs [dir]
import fs from 'node:fs'
import path from 'node:path'
import { GLTFLoader } from '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from '../../node_modules/three/examples/jsm/libs/meshopt_decoder.module.js'
import { checkLicenceRecords } from './licence-primary-sources.mjs'
const dir = process.argv[2] || 'public/bodyexposure'
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
const WAJIB = ['panacea_source', 'panacea_license', 'panacea_accuracy_status']
const lisensi = new Map(), akurasi = new Map(), sumber = new Map(), missing = []; let struktur = 0, files = 0
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.glb') && !x.includes('rig')).sort()) {
  const buf = fs.readFileSync(path.join(dir, f))
  const gltf = await new Promise((res, rej) => loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '', res, rej))
  files++
  gltf.scene.traverse((o) => {
    const u = o.userData ?? {}
    if (!u.panacea_structure_id) return
    struktur++
    const lack = WAJIB.filter((k) => typeof u[k] !== 'string' || !u[k].trim())
    if (lack.length) missing.push(`${f}:${u.panacea_structure_id}:${lack.join('+')}`)
    const inc = (m, k) => m.set(k, (m.get(k) ?? 0) + 1)
    inc(lisensi, u.panacea_license ?? '(kosong)'); inc(akurasi, u.panacea_accuracy_status ?? '(kosong)'); inc(sumber, String(u.panacea_source ?? '(kosong)').slice(0, 70))
  })
}
const top = (m) => Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8))
console.log(JSON.stringify({ files, struktur, tanpaMetadata: missing.length, lisensi: top(lisensi), akurasi: top(akurasi), sumber: top(sumber) }, null, 1))
if (missing.length) { console.log(missing.slice(0, 15).join('\n')); process.exit(1) }
// ENG-D8-03: setiap kelas lisensi yang dipakai harus punya catatan sumber primer; ICRP dicatat sebagai pernyataan pemilik.
const { used, problems } = checkLicenceRecords([...lisensi.keys()], JSON.parse(fs.readFileSync('governance/LICENCE_PRIMARY_SOURCES.json', 'utf8')))
if (problems.length) { console.log(problems.join('\n')); process.exit(1) }
console.log(`licence classes with primary-source records: ${used.join(', ')}`)
