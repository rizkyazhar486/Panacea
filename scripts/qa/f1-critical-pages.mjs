// ENG-F1-03 / T-F1-01: inventaris halaman kritis F1 (governance/F1_CRITICAL_PAGES.json) harus SAMA dengan daftar yang dijalani
// user-journey-resilience (per peran) dan setiap rute harus benar-benar punya halaman di router, bukan jatuh ke 404.
// BATAS: membuktikan inventaris = cakupan skrip + rute terdaftar. Tidak membuktikan halaman itu tahan gangguan (itu run peramban F1).

/** `rute: [...]` per `J: '<peran>'` pada blok PERAN skrip ketahanan. Format tak dikenal -> {} (pemanggil harus gagal, bukan lolos). */
export function coverageFromScript(source) {
  const out = {}
  for (const m of String(source ?? '').matchAll(/J:\s*'([a-z]+)'[\s\S]*?rute:\s*\[([^\]]*)\]/g)) {
    out[m[1]] = [...m[2].matchAll(/'(#\/[^']*)'/g)].map((r) => r[1])
  }
  return out
}

/** Bandingkan inventaris {peran: rute[]} dengan cakupan; kembalikan selisih bernama (kosong = sama persis). */
export function diffInventory(inventory, coverage) {
  const diffs = []
  const roles = new Set([...Object.keys(inventory ?? {}), ...Object.keys(coverage ?? {})])
  for (const role of [...roles].sort()) {
    const inv = new Set(inventory?.[role] ?? []), cov = new Set(coverage?.[role] ?? [])
    for (const r of inv) if (!cov.has(r)) diffs.push(`${role}: ${r} ada di inventaris tetapi tidak dijalani skrip`)
    for (const r of cov) if (!inv.has(r)) diffs.push(`${role}: ${r} dijalani skrip tetapi tidak ada di inventaris`)
  }
  return diffs
}

/** Rute `<Route path=...>` dan alias `<Navigate to=...>` dari sumber router. */
export function routerTable(source) {
  const routes = new Map()
  for (const m of String(source ?? '').matchAll(/<Route\s+path="([^"]+)"\s+element=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*\/>/g)) {
    const nav = /<Navigate\s+to="([^"?]+)/.exec(m[2])
    routes.set(m[1], nav ? { alias: nav[1] } : { page: true })
  }
  return routes
}

/** Rute hash (`#/x`) -> halaman nyata? Alias diikuti maksimal 3 lompatan; `*` (404) tidak pernah dihitung. */
export function resolvesToPage(hashRoute, table) {
  let path = String(hashRoute ?? '').replace(/^#/, '').split('?')[0]
  for (let hop = 0; hop < 4; hop++) {
    const entry = table.get(path)
    if (!entry) return false
    if (entry.page) return true
    path = entry.alias
  }
  return false
}
