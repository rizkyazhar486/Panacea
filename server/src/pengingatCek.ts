// Pengingat cek harian (Continuous Care). Keputusannya murni supaya bisa diuji
// tanpa menunggu jam berjalan. Teks notifikasi tidak memuat PHI: tidak ada
// nama dokter, diagnosis, maupun isi pertanyaan — layar kunci bisa dilihat orang lain.

export type AlasanCek = 'off' | 'no-target' | 'no-plan' | 'done-today' | 'not-time' | 'already-today' | 'send'

export function putusanPengingatCek(prefs: Record<string, unknown>, nowMs: number, punyaRencanaAktif: boolean, tanggalSudahLapor: string[]): { alasan: AlasanCek; tanggalLokal: string } {
  const off = Number(prefs.tzOffsetMin)
  const lokal = new Date(nowMs + (Number.isFinite(off) ? off : 0) * 60_000)
  const tanggalLokal = lokal.toISOString().slice(0, 10)
  const hasil = (alasan: AlasanCek) => ({ alasan, tanggalLokal })
  if (prefs.notifCekHarian !== true) return hasil('off')
  const m = typeof prefs.cekHarianHHMM === 'string' ? prefs.cekHarianHHMM.match(/^(\d{1,2}):(\d{2})$/) : null
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return hasil('no-target')
  if (!punyaRencanaAktif) return hasil('no-plan')
  if (tanggalSudahLapor.includes(tanggalLokal)) return hasil('done-today')
  const target = Number(m[1]) * 60 + Number(m[2])
  const kini = lokal.getUTCHours() * 60 + lokal.getUTCMinutes()
  const selisih = Math.min(Math.abs(kini - target), 1440 - Math.abs(kini - target))
  if (selisih > 2) return hasil('not-time')
  if (prefs.cekHarianLastFiredOn === tanggalLokal) return hasil('already-today')
  return hasil('send')
}

export const PESAN_PENGINGAT_CEK = { title: 'Daily check-in', body: 'Your doctor asked for a short check-in today.', url: './#/', tag: 'cek-harian' }
