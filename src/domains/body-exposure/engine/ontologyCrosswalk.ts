// Pemetaan struktur tubuh ke ID ontologi (Uberon/FMA) dari tabel crosswalk HuBMAP/HRA, dicocokkan lewat nama sumber persis.
// Murni (tanpa DOM/jaringan): masukan baris CSV dan daftar struktur, keluaran peta + alasan penolakan. Gagal-tertutup: ID kosong, format salah,
// atau dua baris dengan nama sama tetapi ID berbeda TIDAK dipetakan (tidak ada tebakan); struktur tanpa baris tidak diberi ID.

export interface CrosswalkRow { node_name: string; OntologyID: string; label: string }
export interface StructureRef { panacea_structure_id: string; panacea_body_id: string; panacea_source_raw_name: string }
export interface CrosswalkEntry { id: string; label: string }
export interface Rejected { node_name: string; reason: string }
export interface CrosswalkResult {
  map: Record<string, CrosswalkEntry>
  rejected: Rejected[]
  /** baris CSV yang tidak cocok dengan struktur mana pun pada tubuh ini (mis. simpul pengelompokan) */
  unmatched_rows: string[]
  structures_total: number
}

export const ONTOLOGY_ID = /^(UBERON|FMA):\d{1,9}$/

export function buildCrosswalk(rows: readonly CrosswalkRow[], structures: readonly StructureRef[], bodyId: string): CrosswalkResult {
  const mine = structures.filter((s) => s.panacea_body_id === bodyId)
  const byRaw = new Map<string, string[]>()
  for (const s of mine) byRaw.set(s.panacea_source_raw_name, [...(byRaw.get(s.panacea_source_raw_name) ?? []), s.panacea_structure_id])

  const rejected: Rejected[] = []
  const seen = new Map<string, CrosswalkRow>()
  const conflicted = new Set<string>()
  for (const r of rows) {
    const name = (r.node_name ?? '').trim()
    const id = (r.OntologyID ?? '').trim()
    if (!name) { rejected.push({ node_name: '', reason: 'empty node name' }); continue }
    if (!id) { rejected.push({ node_name: name, reason: 'empty ontology id' }); continue }
    if (!ONTOLOGY_ID.test(id)) { rejected.push({ node_name: name, reason: `ontology id is not UBERON:n or FMA:n (${id})` }); continue }
    const prev = seen.get(name)
    if (prev && prev.OntologyID.trim() !== id) { conflicted.add(name); continue }
    seen.set(name, { node_name: name, OntologyID: id, label: (r.label ?? '').trim() })
  }
  for (const name of conflicted) { seen.delete(name); rejected.push({ node_name: name, reason: 'two rows give the same name different ontology ids' }) }

  const map: Record<string, CrosswalkEntry> = {}
  const unmatched: string[] = []
  for (const [name, r] of seen) {
    const ids = byRaw.get(name)
    if (!ids) { unmatched.push(name); continue }
    for (const sid of ids) map[sid] = { id: r.OntologyID, label: r.label }
  }
  return { map, rejected, unmatched_rows: unmatched.sort(), structures_total: mine.length }
}
