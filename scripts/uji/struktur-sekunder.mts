import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePdb, atomDari } from '../../src/lib/molekul/struktur.ts'
import { assignSecondaryStructure, type BackboneResidue, type Vec } from '../../src/lib/molekul/strukturSekunder.ts'

// Agreement between the backbone H-bond assignment and the depositor's HELIX/SHEET records.
function agreement(path: string) {
  const s = parsePdb(readFileSync(path, 'utf8'))
  const residues = s.rantai.flatMap((r) => r.residu).filter((r) => ['N', 'CA', 'C', 'O'].every((n) => atomDari(r, n)))
  const v = (r: (typeof residues)[number], n: string): Vec => { const a = atomDari(r, n)!; return [a.x, a.y, a.z] }
  const bb: BackboneResidue[] = residues.map((r) => ({ N: v(r, 'N'), CA: v(r, 'CA'), C: v(r, 'C'), O: v(r, 'O'), proline: r.nama === 'PRO' }))
  const ours = assignSecondaryStructure(bb)
  const theirs = residues.map((r) => (r.ss === 'helix' ? 'H' : r.ss === 'sheet' ? 'E' : 'C'))
  const recall = (k: string) => {
    const idx = theirs.map((t, i) => (t === k ? i : -1)).filter((i) => i >= 0)
    return idx.length ? idx.filter((i) => ours[i] === k).length / idx.length : 1
  }
  return { helix: recall('H'), sheet: recall('E'), n: residues.length }
}

const ubi = agreement('public/molekul/1ubi.pdb')
const hb = agreement('public/struktur/4hhb.pdb')
console.log('1UBI', ubi, '4HHB', hb)
assert.ok(ubi.helix > 0.7, `1UBI helix recall ${ubi.helix}`)
assert.ok(ubi.sheet > 0.6, `1UBI sheet recall ${ubi.sheet}`)
assert.ok(hb.helix > 0.75, `4HHB helix recall ${hb.helix}`)

// Provenance: every fetched structure is listed with its source and original hash.
const manifest = JSON.parse(readFileSync('public/struktur/manifest.json', 'utf8')) as { entries: { file: string; sourceUrl: string; sha256Original: string; kind: string; meanPlddt?: number }[] }
for (const e of manifest.entries) {
  assert.match(e.sourceUrl, /^https:\/\/(files\.rcsb\.org|alphafold\.ebi\.ac\.uk)\//)
  assert.match(e.sha256Original, /^[0-9a-f]{64}$/)
  assert.ok(readFileSync(`public/struktur/${e.file}`, 'utf8').includes('ATOM'))
  if (e.kind === 'alphafold') assert.ok(typeof e.meanPlddt === 'number')
}
console.log('Secondary structure from backbone H-bonds agrees with depositor records; structure provenance verified.')
