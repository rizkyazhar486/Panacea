// Fetches the macromolecular structures the Body page renders as ribbons:
// AlphaFold DB models for the genome atlas genes (UniProt accession resolved
// from UniProt REST at fetch time) and experimental PDB entries for DNA,
// RNA, chromatin and haemoglobin. Files are trimmed to the atoms the cartoon
// needs (protein backbone + CB, nucleic backbone + base ring, ligands; no
// waters) and the SHA-256 of each original download is recorded.
// Run: node scripts/bangun/ambil-struktur-3d.mjs
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

const OUT = 'public/struktur'
const UA = { 'User-Agent': 'Mozilla/5.0 (Panaceamed structure fetch)' }

const GENES = ['TP53', 'BRCA1', 'APOE', 'SCN5A', 'CFTR', 'HTT']
// AlphaFold DB publishes no model for proteins this long; use the experimental structure.
const EXPERIMENTAL_FALLBACK = { HTT: { pdbId: '6EZ8', title: 'Huntingtin in complex with HAP40 (cryo-EM)' } }
const PDB = {
  '1BNA': 'B-DNA dodecamer (Drew–Dickerson), the canonical double helix',
  '1EHZ': 'Yeast phenylalanine tRNA, an RNA fold',
  '1KX5': 'Nucleosome core particle: 147 bp DNA wrapped on a histone octamer',
  '4HHB': 'Human deoxyhaemoglobin, two alpha and two beta chains with haem',
}

const PROTEIN_ATOMS = new Set(['N', 'CA', 'C', 'O', 'CB'])
const NUCLEIC_ATOMS = new Set(['P', "O5'", "C5'", "C4'", "C3'", "O3'", "C1'", 'N1', 'C2', 'N3', 'C4', 'C5', 'C6', 'N7', 'C8', 'N9'])
const NUCLEOTIDES = new Set(['A', 'C', 'G', 'U', 'T', 'DA', 'DC', 'DG', 'DT', 'DU'])

async function text(url) {
  const res = await fetch(url, { headers: UA })
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return res.text()
}

function trim(pdb) {
  const keep = []
  for (const line of pdb.split(/\r?\n/)) {
    const rec = line.slice(0, 6)
    if (rec === 'ENDMDL') break
    if (['HEADER', 'TITLE ', 'SOURCE', 'EXPDTA', 'DBREF ', 'HELIX ', 'SHEET ', 'TER   '].includes(rec) || /^REMARK   2 RESOLUTION/.test(line)) { keep.push(line); continue }
    if (rec !== 'ATOM  ' && rec !== 'HETATM') continue
    const atom = line.slice(12, 16).trim()
    const res = line.slice(17, 20).trim()
    const alt = line[16]
    if (alt !== ' ' && alt !== 'A') continue
    if (res === 'HOH') continue
    if (rec === 'HETATM') keep.push(line)
    else if (NUCLEOTIDES.has(res) ? NUCLEIC_ATOMS.has(atom) : PROTEIN_ATOMS.has(atom)) keep.push(line)
  }
  return keep.join('\n') + '\nEND\n'
}

const sha = (s) => createHash('sha256').update(s).digest('hex')

// Downloads one RCSB entry, writes the trimmed file and returns its provenance fields.
async function fetchPdb(pdbId, file) {
  const url = `https://files.rcsb.org/download/${pdbId}.pdb`
  const raw = await text(url)
  await writeFile(`${OUT}/${file}`, trim(raw))
  const method = raw.match(/^EXPDTA\s+(.+)$/m)?.[1].trim() ?? ''
  const resolution = raw.match(/^REMARK   2 RESOLUTION\.\s+([\d.]+)/m)?.[1] ?? null
  return { kind: 'pdb', pdbId, method, resolutionA: resolution && Number(resolution), sourceUrl: url, sha256Original: sha(raw), file, licence: 'wwPDB, CC0 1.0' }
}

await mkdir(OUT, { recursive: true })
const manifest = { generated: new Date().toISOString().slice(0, 10), entries: [] }

for (const gene of GENES) {
  const tsv = await text(`https://rest.uniprot.org/uniprotkb/search?query=gene_exact:${gene}+AND+organism_id:9606+AND+reviewed:true&fields=accession,gene_primary,protein_name,length&format=tsv`)
  // gene_exact also matches synonyms (HTT -> SLC6A4 "5HTT"), so require the primary symbol.
  const row = tsv.trim().split('\n').slice(1).map((r) => r.split('\t')).find((r) => r[1] === gene)
  if (!row) throw new Error(`No reviewed human UniProt entry with primary gene ${gene}`)
  const [accession, , name, length] = row
  const predictions = JSON.parse(await text(`https://alphafold.ebi.ac.uk/api/prediction/${accession}`).catch(() => '[]'))
  const model = predictions.find((p) => p.uniprotStart === 1) ?? predictions[0]
  const fallback = EXPERIMENTAL_FALLBACK[gene]
  if (!model && fallback) {
    const pdb = await fetchPdb(fallback.pdbId, `${gene.toLowerCase()}.pdb`)
    manifest.entries.push({ id: gene.toLowerCase(), gene, uniprot: accession, title: fallback.title, length: Number(length), reason: 'AlphaFold DB publishes no model for this accession', ...pdb })
    console.log(gene, accession, 'experimental', fallback.pdbId, pdb.method, pdb.resolutionA)
    continue
  }
  if (!model) throw new Error(`No AlphaFold model for ${gene} ${accession}`)
  const raw = await text(model.pdbUrl)
  const file = `${gene.toLowerCase()}.pdb`
  await writeFile(`${OUT}/${file}`, trim(raw))
  manifest.entries.push({
    id: gene.toLowerCase(), kind: 'alphafold', gene, uniprot: accession, title: name.replace(/\s*\(.*$/, ''), length: Number(length),
    residues: [model.uniprotStart, model.uniprotEnd], meanPlddt: model.globalMetricValue, sourceUrl: model.pdbUrl, sha256Original: sha(raw), file,
    licence: 'AlphaFold DB, CC BY 4.0', citation: 'Jumper J et al. Nature 2021;596:583-589; Varadi M et al. Nucleic Acids Res 2024;52:D368-D375.',
  })
  console.log(gene, accession, `${model.uniprotStart}-${model.uniprotEnd}/${length}`, `pLDDT ${model.globalMetricValue}`)
}

for (const [id, title] of Object.entries(PDB)) {
  const pdb = await fetchPdb(id, `${id.toLowerCase()}.pdb`)
  manifest.entries.push({ id: id.toLowerCase(), title, ...pdb })
  console.log(id, pdb.method, pdb.resolutionA)
}

await writeFile(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n')
