// ─────────────────────────────────────────────────────────────────────────────
// Tanggal kalender setempat.
//
// `new Date().toISOString().slice(0, 10)` memberi tanggal UTC, bukan tanggal
// Anda. Di WIB (UTC+7) itu berarti batas hari jatuh pukul 07.00 pagi, bukan
// tengah malam: lari jam 06.00 tercatat sebagai kemarin, check-in jam 06.00 dan
// jam 08.00 dihitung dua hari berbeda, dan label tanggal pada grafik bergeser
// satu hari dari log yang ada di bawahnya.
//
// Semua penanggalan "hari kalender" di aplikasi ini harus lewat sini. Yang
// tetap memakai ISO/UTC adalah penanda WAKTU (mis. `measuredAt`) — itu memang
// harus mutlak dan bebas zona waktu.
// ─────────────────────────────────────────────────────────────────────────────

/** Kunci hari (yyyy-mm-dd) menurut kalender setempat. */
export function kunciHari(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Today menurut kalender setempat. */
export function hariIni(): string {
  return kunciHari(new Date())
}

/** Hari sekian hari yang lalu, menurut kalender setempat. */
export function hariLalu(selisih: number): string {
  const d = new Date()
  d.setDate(d.getDate() - selisih)
  return kunciHari(d)
}
