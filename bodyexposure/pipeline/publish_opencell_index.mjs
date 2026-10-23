// Tulis public/bodyexposure/opencell_index.json dari dua CSV OpenCell (lokalisasi + kelimpahan). CSV tidak disalin ke repo; SHA-256 dicatat.
//   node bodyexposure/pipeline/publish_opencell_index.mjs --loc ~/Downloads/opencell-localization-annotations.csv --abundance ~/Downloads/opencell-protein-abundance.csv
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import os from 'node:os'
import { buildOpenCellIndex } from '../../src/domains/body-exposure/engine/openCellIndex.ts'

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined }
const locPath = arg('--loc')?.replace(/^~/, os.homedir()), abPath = arg('--abundance')?.replace(/^~/, os.homedir())
if (!locPath || !abPath) { console.error('usage: --loc <csv> --abundance <csv>'); process.exit(2) }

function parseCsv(text) {
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
const table = (buf) => { const [h, ...b] = parseCsv(buf.toString('utf8').replace(/^﻿/, '')); return b.map((r) => Object.fromEntries(h.map((k, i) => [k.trim(), r[i] ?? '']))) }
const locBuf = await readFile(locPath), abBuf = await readFile(abPath)
const res = buildOpenCellIndex(table(locBuf), table(abBuf))
const out = {
  schema: 1, kind: 'opencell_index',
  licence: 'CC BY-SA 4.0 (OpenCell on AWS, Chan Zuckerberg Biohub, https://registry.opendata.aws/czb-opencell)',
  citation: 'Cho NH, Cheveralls KC, Brunner AD, et al. OpenCell: endogenous tagging for the cartographic study of human cellular organization. Science 375:eabi6983 (2022). "OpenCell on AWS" accessed 2026-10-11 from https://registry.opendata.aws/czb-opencell.',
  limitations: 'Measured in cultured HEK293T cells (a human embryonic kidney cell line) with one protein tagged at a time; it is not the localisation or abundance in the tissue or body shown in Body Exposure. Localisation grade 3 is the most prominent annotation, grade 1 the weakest.',
  source_files: { localisation: { sha256: createHash('sha256').update(locBuf).digest('hex'), rows: table(locBuf).length }, abundance: { sha256: createHash('sha256').update(abBuf).digest('hex'), rows: table(abBuf).length } },
  proteins_without_abundance: res.withoutAbundance, rejected: res.rejected, proteins: res.proteins,
}
await writeFile('public/bodyexposure/opencell_index.json', JSON.stringify(out) + '\n')
console.log(`OPENCELL ${res.proteins.length} proteins, ${res.rejected.length} rejected, ${res.withoutAbundance} without abundance`, res.rejected.slice(0, 5))
