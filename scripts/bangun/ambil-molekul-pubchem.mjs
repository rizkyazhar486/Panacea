// Fetches PubChem 3D conformers for the metabolites shown on the Body page's
// Compound rung. CIDs are resolved from PubChem by name at fetch time and
// written into the manifest with the exact URL used, so the rendered atoms
// trace back to PubChem rather than to hand-entered coordinates.
// Run: node scripts/bangun/ambil-molekul-pubchem.mjs
import { mkdir, rm, writeFile } from 'node:fs/promises'

const OUT = 'public/molecules'
const PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'

// id -> PubChem name query, or a pinned CID where the UI already cites one
// (keeps the shown formula and charge state identical to the rendered record).
const COMPOUNDS = {
  glucose: 5793,
  pyruvate: 'pyruvate',
  'acetyl-coa': 'acetyl-CoA',
  'nad-plus': 5893,
  nadh: 439153,
  fad: 'flavin adenine dinucleotide',
  fadh2: 'FADH2',
  adp: 'adenosine diphosphate',
  atp: 5957,
  oxygen: 'oxygen',
  co2: 'carbon dioxide',
}

async function get(url) {
  const res = await fetch(url)
  return { ok: res.ok, status: res.status, text: await res.text() }
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })
const manifest = { source: 'PubChem PUG REST', fetchedAt: new Date().toISOString(), compounds: {} }

for (const [id, name] of Object.entries(COMPOUNDS)) {
  const cidRes = typeof name === 'number' ? { ok: true, status: 200, text: String(name) } : await get(`${PUG}/compound/name/${encodeURIComponent(name)}/cids/TXT`)
  const cid = cidRes.ok ? Number(cidRes.text.trim().split(/\s+/)[0]) : null
  if (!cid) { manifest.compounds[id] = { query: name, cid: null, conformer: null, reason: `name lookup HTTP ${cidRes.status}` }; continue }
  const sdfUrl = `${PUG}/compound/cid/${cid}/SDF?record_type=3d`
  const sdf = await get(sdfUrl)
  if (!sdf.ok) {
    manifest.compounds[id] = { query: name, cid, conformer: null, reason: `PubChem has no computed 3D conformer (HTTP ${sdf.status})` }
  } else {
    await writeFile(`${OUT}/${id}.sdf`, sdf.text)
    const title = (await get(`${PUG}/compound/cid/${cid}/property/Title/TXT`)).text.trim()
    manifest.compounds[id] = { query: name, cid, title, conformer: `${id}.sdf`, sourceUrl: sdfUrl }
  }
  console.log(id, cid, manifest.compounds[id].conformer ?? manifest.compounds[id].reason)
  await new Promise((r) => setTimeout(r, 250)) // PubChem asks for <= 5 requests/s
}
await writeFile(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
