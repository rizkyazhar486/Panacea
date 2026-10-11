// Tulis public/bodyexposure/ontology.<tag>.json dari tabel crosswalk (CSV: node_name,OntologyID,label) untuk satu tubuh.
//   node bodyexposure/pipeline/publish_ontology_crosswalk.mjs --csv ~/Downloads/crosswalkfemale.csv --body HUMAN.ADULT.FEMALE
// CSV tidak disalin ke repo; hash SHA-256 dan jumlah baris dicatat supaya hasilnya dapat direproduksi dari berkas yang sama.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import os from 'node:os'
import { buildCrosswalk } from '../../src/domains/body-exposure/engine/ontologyCrosswalk.ts'

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined }
const csvPath = arg('--csv')?.replace(/^~/, os.homedir()), bodyId = arg('--body')
if (!csvPath || !bodyId) { console.error('usage: --csv <file> --body <body id>'); process.exit(2) }

function parseCsv(text) {  // CSV sederhana dengan tanda kutip ganda
  const rows = []; let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += c }
    else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((x) => x.trim()))
}

const buf = await readFile(csvPath)
const [head, ...body] = parseCsv(buf.toString('utf8'))
const col = (n) => head.indexOf(n)
if ([col('node_name'), col('OntologyID'), col('label')].includes(-1)) throw new Error('CSV needs the columns node_name, OntologyID, label')
const rows = body.map((r) => ({ node_name: r[col('node_name')] ?? '', OntologyID: r[col('OntologyID')] ?? '', label: r[col('label')] ?? '' }))
const structures = JSON.parse(await readFile('bodyexposure/manifest/structures.json', 'utf8')).structures
const res = buildCrosswalk(rows, structures, bodyId)
const tag = bodyId.replace('HUMAN.', '').replaceAll('.', '_').toLowerCase()
const out = {
  schema: 1, body_id: bodyId,
  source: 'HuBMAP / Human Reference Atlas ASCT+B 3D model crosswalk (node name to Uberon/FMA id)',
  licence_note: 'Identifiers and labels only. The licence of the crosswalk table was not confirmed from a machine-readable source; attribute to HuBMAP / HRA.',
  csv: { file: csvPath.split('/').pop(), sha256: createHash('sha256').update(buf).digest('hex'), rows: rows.length },
  matched_structures: Object.keys(res.map).length, structures_total: res.structures_total,
  rejected: res.rejected, unmatched_rows: res.unmatched_rows.length, map: res.map,
}
await writeFile(`public/bodyexposure/ontology.${tag}.json`, JSON.stringify(out) + '\n')
console.log(`ONTOLOGY ${bodyId}: ${out.matched_structures}/${out.structures_total} structures mapped, ${res.rejected.length} rows rejected, ${res.unmatched_rows.length} rows without a structure`)
