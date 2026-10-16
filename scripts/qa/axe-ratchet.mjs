// Logika murni gerbang axe (tanpa browser/jaringan) supaya dapat diuji. Dipakai oleh scripts/qa/axe-audit.mjs.
export const DAMPAK_GERBANG = new Set(['critical', 'serious'])

/** Ringkas hasil axe ke bentuk stabil: id aturan -> {dampak, node}. */
export const ringkasPelanggaran = (violations) => Object.fromEntries(violations.map((v) => [v.id, { dampak: v.impact ?? 'minor', node: v.nodes.length }]))

/** Bandingkan pengukuran dengan baseline. Mengembalikan daftar pelanggaran gerbang (kosong = lulus).
 *  Fail-closed: tanpa baseline yang valid, gerbang tidak dapat dinilai dan dianggap gagal. */
export const bandingkan = (aturan, baseline) => {
  if (!baseline || typeof baseline.aturan !== 'object' || baseline.aturan === null || !Number.isFinite(baseline.totalNodeSeriusKritis)) {
    return ['AXE_BASELINE tidak ada atau tidak valid: gerbang tidak dapat dinilai (fail-closed)']
  }
  const gagal = []
  let total = 0
  for (const [id, a] of Object.entries(aturan)) {
    if (!DAMPAK_GERBANG.has(a.dampak)) continue
    total += a.node
    if (!(id in baseline.aturan)) gagal.push(`aturan baru ${a.dampak} tidak ada di baseline: ${id} (${a.node} node)`)
    else if (a.node > baseline.aturan[id]) gagal.push(`${id} (${a.dampak}) naik: ${a.node} > baseline ${baseline.aturan[id]}`)
  }
  if (total > baseline.totalNodeSeriusKritis) gagal.push(`total node serius+kritis ${total} > baseline ${baseline.totalNodeSeriusKritis}`)
  return gagal
}
