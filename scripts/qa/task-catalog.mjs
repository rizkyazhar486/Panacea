// Validator untuk governance/TASK_CATALOG.json (router kapabilitas Super Intelligence).
// Murni: pengecekan berkas diinjeksikan (`ada`) agar kontrol negatif tidak menyentuh disk.
// Kosakata tertutup (kapabilitas, tier, mode review manusia) ditanam di KODE ini, bukan dipercaya dari
// katalog: katalog yang memperluas kosakata (mis. mode "waived") ditolak.
// BATAS: memastikan katalog terstruktur dan tidak pernah mewajibkan manusia untuk kemajuan engineering;
// TIDAK menilai kualitas model atau memverifikasi bahwa tugas selesai.
export const KAPABILITAS = ['systems-reasoning', 'repo-engineering', 'medical-scientific', 'security-privacy', 'ux-visual', 'release-quality', 'agent-coordination']
export const TIER = ['S1', 'S2', 'S3']
export const MODE_REVIEW = ['none', 'optional']
const KELAS_S3 = ['rbac-privacy', 'clinical-calculator', 'release-deploy', 'research-evidence']
const FIELD_TEKS = ['id', 'minTier', 'procedure']
const FIELD_DAFTAR = ['capabilities', 'mustLeave', 'never']

const sama = (a, b) => Array.isArray(a) && a.length === b.length && b.every((x, i) => a[i] === x)
const teksTak_kosong = (v) => typeof v === 'string' && v.trim() !== ''
const daftarTeks = (v) => Array.isArray(v) && v.length > 0 && v.every(teksTak_kosong)

export function validasi(katalog, { ada, gateIds }) {
  const e = []
  if (!katalog || typeof katalog !== 'object' || Array.isArray(katalog)) return ['katalog bukan objek']
  if (katalog.version !== 1) e.push('version harus 1')
  if (!sama(katalog.capabilities, KAPABILITAS)) e.push('capabilities harus persis kosakata tertutup yang ditetapkan validator')
  if (!sama(katalog.tiers, TIER)) e.push('tiers harus persis S1,S2,S3')
  if (!sama(katalog.humanReviewModes, MODE_REVIEW)) e.push('humanReviewModes harus persis none,optional (tidak ada mode wajib atau waived)')
  if (!teksTak_kosong(katalog.doc) || !ada(katalog.doc)) e.push(`dokumen tidak ada: ${katalog.doc}`)
  const kelas = katalog.classes
  if (!Array.isArray(kelas) || kelas.length === 0) {
    e.push('classes harus array tidak kosong')
    return e
  }
  const ids = new Set()
  for (const c of kelas) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) { e.push('kelas bukan objek'); continue }
    const w = `kelas ${c.id ?? '(tanpa id)'}`
    for (const k of FIELD_TEKS) if (!teksTak_kosong(c[k])) e.push(`${w}: field ${k} kosong atau bukan teks`)
    for (const k of FIELD_DAFTAR) if (!daftarTeks(c[k])) e.push(`${w}: field ${k} harus daftar teks tidak kosong`)
    if (ids.has(c.id)) e.push(`${w}: id ganda`)
    ids.add(c.id)
    if (!TIER.includes(c.minTier)) e.push(`${w}: minTier ${c.minTier} tidak dikenal`)
    for (const k of Array.isArray(c.capabilities) ? c.capabilities : []) if (!KAPABILITAS.includes(k)) e.push(`${w}: kapabilitas ${k} tidak dikenal`)
    const hr = c.humanReview
    if (!hr || typeof hr !== 'object') {
      e.push(`${w}: field humanReview kosong atau bukan objek`)
    } else {
      if (!MODE_REVIEW.includes(hr.mode)) e.push(`${w}: humanReview.mode ${hr.mode} tidak diizinkan (hanya none atau optional)`)
      const g = hr.deferredGate
      if (g !== null && g !== undefined && (!teksTak_kosong(g) || !gateIds.has(g))) e.push(`${w}: deferredGate ${g} tidak ada di ACCEPTANCE_V2`)
    }
    if (teksTak_kosong(c.procedure) && !ada(c.procedure)) e.push(`${w}: prosedur tidak ada: ${c.procedure}`)
    // Kelas yang menyentuh data pasien/angka medis tidak boleh diserahkan ke tier terendah.
    if (KELAS_S3.includes(c.id) && c.minTier !== 'S3') e.push(`${w}: harus minTier S3`)
  }
  for (const id of KELAS_S3) if (!ids.has(id)) e.push(`kelas wajib tidak ada: ${id}`)
  return e
}
