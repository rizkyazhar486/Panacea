// ─────────────────────────────────────────────────────────────────────────────
// Catatan kemajuan kalistenik.
//
// Yang dicatat hanya SATU hal per tangga: anak tangga tertinggi yang sudah
// benar-benar dikuasai, beserta tanggalnya. Bukan tiap set, bukan tiap
// repetisi.
//
// Alasannya sederhana: catatan yang menuntut banyak isian tidak diisi. Dan
// pertanyaan yang sebenarnya ingin dijawab orang setelah beberapa bulan bukan
// "berapa repetisi hari Selasa lalu" melainkan "apakah saya benar-benar maju" —
// dan itu dijawab oleh tanggal naik tangga, bukan oleh jumlah repetisi.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_kalistenik_v1'

export interface Kemajuan {
  /** tanggaId → { level tertinggi yang dikuasai, tanggal ISO }. */
  [tanggaId: string]: { level: number; tanggal: string }
}

export function bacaKemajuan(): Kemajuan {
  try {
    const raw = localStorage.getItem(KUNCI)
    if (!raw) return {}
    const p = JSON.parse(raw) as Kemajuan
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

export function tandaiLevel(tanggaId: string, level: number): Kemajuan {
  const semua = bacaKemajuan()
  if (level <= 0) delete semua[tanggaId]
  else semua[tanggaId] = { level, tanggal: new Date().toISOString().slice(0, 10) }
  try {
    localStorage.setItem(KUNCI, JSON.stringify(semua))
  } catch {
    /* penyimpanan penuh atau ditolak — nilai di layar tetap benar sesi ini */
  }
  return semua
}

/** Berapa gerakan yang sudah dilewati, dari total yang ada. */
export function hitungTuntas(
  kemajuan: Kemajuan,
  tangga: { id: string; anak: { level: number }[] }[],
): { tuntas: number; total: number } {
  let tuntas = 0
  let total = 0
  for (const t of tangga) {
    total += t.anak.length
    const lv = kemajuan[t.id]?.level ?? 0
    tuntas += t.anak.filter((a) => a.level <= lv).length
  }
  return { tuntas, total }
}
