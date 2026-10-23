// Validator untuk governance/TASK_CATALOG.json (router kapabilitas Super Intelligence).
// Murni: pengecekan berkas diinjeksikan (`ada`) agar kontrol negatif tidak menyentuh disk.
// BATAS: memastikan katalog terstruktur dan tidak pernah mewajibkan manusia untuk
// kemajuan engineering; TIDAK menilai kualitas model atau memverifikasi bahwa tugas selesai.
const WAJIB = ['id', 'minTier', 'capabilities', 'mustLeave', 'never', 'humanReview', 'procedure']

export function validasi(katalog, { ada, gateIds }) {
  const e = []
  const kap = new Set(katalog.capabilities ?? [])
  const tier = new Set(katalog.tiers ?? [])
  const mode = new Set(katalog.humanReviewModes ?? [])
  if (mode.has('required') || mode.has('mandatory')) e.push('humanReviewModes tidak boleh memuat mode wajib untuk engineering')
  if (!ada(katalog.doc ?? '')) e.push(`dokumen tidak ada: ${katalog.doc}`)
  const ids = new Set()
  for (const c of katalog.classes ?? []) {
    const w = `kelas ${c.id ?? '(tanpa id)'}`
    for (const k of WAJIB) {
      const v = c[k]
      if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) e.push(`${w}: field ${k} kosong`)
    }
    if (ids.has(c.id)) e.push(`${w}: id ganda`)
    ids.add(c.id)
    if (!tier.has(c.minTier)) e.push(`${w}: minTier ${c.minTier} tidak dikenal`)
    for (const k of c.capabilities ?? []) if (!kap.has(k)) e.push(`${w}: kapabilitas ${k} tidak dikenal`)
    if (c.humanReview) {
      if (!mode.has(c.humanReview.mode)) e.push(`${w}: humanReview.mode ${c.humanReview.mode} tidak diizinkan (hanya none atau optional)`)
      const g = c.humanReview.deferredGate
      if (g && !gateIds.has(g)) e.push(`${w}: deferredGate ${g} tidak ada di ACCEPTANCE_V2`)
    }
    if (c.procedure && !ada(c.procedure)) e.push(`${w}: prosedur tidak ada: ${c.procedure}`)
    // Kelas yang menyentuh data pasien/angka medis tidak boleh diserahkan ke tier terendah.
    if (['rbac-privacy', 'clinical-calculator', 'release-deploy', 'research-evidence'].includes(c.id) && c.minTier !== 'S3') e.push(`${w}: harus minTier S3`)
  }
  return e
}
