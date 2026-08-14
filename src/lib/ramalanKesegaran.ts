import { statusSingkat } from './pelatih'
import { catatRamalan, periksaRamalan, rapor, kunciTanggal, semuaRamalan, type Ramalan } from './ramalan'
import type { ImportedWorkout } from './workoutImport'

// ─────────────────────────────────────────────────────────────────────────────
// Meramalkan kesegaran besok, lalu memeriksanya lusa.
//
// MENGAPA KESEGARAN YANG DIPILIH. Ia satu-satunya angka di aplikasi ini yang
// dapat diproyeksikan ke depan secara jujur: model Banister sepenuhnya
// deterministik, sehingga bila beban latihan besok diketahui, kesegaran besok
// dapat dihitung persis. Meramalkan hal yang deterministik terdengar seperti
// curang — dan justru itu yang membuatnya berguna sebagai UJI KEJUJURAN:
//
//   * Bila ramalannya sering meleset padahal modelnya deterministik, maka yang
//     keliru adalah ASUMSI BEBAN, bukan modelnya. Artinya latihan pemakainya
//     jauh lebih tidak teratur daripada yang diduga aplikasi, dan itu keterangan
//     yang berguna.
//   * Bila ramalannya hampir selalu tepat, itu bukan prestasi model melainkan
//     bukti bahwa angka tersebut hanya mencerminkan jadwal latihan — persis
//     yang dikatakan pada penjabaran kesegaran. Ramalan yang tepat justru
//     menegaskan bahwa angka itu tidak mengukur keadaan tubuh.
//
// Kedua hasil itu sama-sama memberi tahu sesuatu yang benar. Itulah bedanya
// dengan angka yang tidak pernah diperiksa: ia tidak pernah dapat salah, dan
// karena itu tidak pernah dapat mengajarkan apa pun.
//
// ASUMSI RAMALAN dinyatakan apa adanya: BESOK TIDAK ADA LATIHAN. Asumsi ini
// dipilih bukan karena paling mungkin, melainkan karena paling dapat diperiksa
// — asumsi yang bergantung pada rencana yang belum tentu dijalankan membuat
// kesalahan ramalan tidak dapat ditelusuri sebabnya.
// ─────────────────────────────────────────────────────────────────────────────

export const JENIS = 'kesegaran'
/** Selisih di bawah ini tidak layak disebut meleset. Sama dengan SDC kesegaran. */
export const AMBANG = 5

export interface Konteks {
  hrMax: number
  hrRest: number
  sex: 'M' | 'F'
}

/**
 * Jalankan satu putaran: periksa ramalan yang sudah jatuh tempo, lalu catat
 * ramalan baru untuk besok.
 *
 * Urutannya penting — memeriksa lebih dahulu, mencatat kemudian. Bila dibalik,
 * ramalan baru untuk besok akan ikut terbaca sebagai jatuh tempo pada putaran
 * yang sama di sekitar tengah malam.
 */
export function jalankanRamalan(
  riwayat: ImportedWorkout[],
  k: Konteks,
  sekarang = Date.now(),
): { dicatat: boolean; diperiksa: number } {
  if (!riwayat.length) return { dicatat: false, diperiksa: 0 }

  // ── Periksa yang sudah jatuh tempo ──
  const hariIni = kunciTanggal(new Date(sekarang))
  let diperiksa = 0
  for (const r of semuaRamalan()) {
    if (r.jenis !== JENIS || r.sebenarnya !== undefined) continue
    if (r.untuk >= hariIni) continue
    // Nilai sebenarnya dihitung dari data yang ada SEKARANG, pada tengah hari
    // tanggal sasaran. Tengah hari dipilih supaya tidak bergantung pada jam
    // berapa pemakainya membuka aplikasi.
    const t = new Date(`${r.untuk}T12:00:00`).getTime()
    if (Number.isNaN(t)) continue
    const st = statusSingkat(riwayat, k, t)
    if (!st) continue
    if (periksaRamalan(JENIS, r.untuk, st.kesegaran, sekarang)) diperiksa++
  }

  // ── Catat ramalan untuk besok ──
  const besok = new Date(sekarang + 86400_000)
  const kunciBesok = kunciTanggal(besok)
  const besokSiang = new Date(`${kunciBesok}T12:00:00`).getTime()
  const proyeksi = Number.isNaN(besokSiang) ? null : statusSingkat(riwayat, k, besokSiang)
  const dicatat = proyeksi
    ? catatRamalan(
        {
          jenis: JENIS,
          label: 'Kesegaran besok',
          untuk: kunciBesok,
          ramalan: Math.round(proyeksi.kesegaran * 10) / 10,
          satuan: 'tanpa satuan',
          model: 'Banister τ=42/7, dengan asumsi TIDAK ADA LATIHAN besok',
          ambang: AMBANG,
        },
        sekarang,
      )
    : false

  return { dicatat, diperiksa }
}

export function raporKesegaran() {
  return rapor(JENIS)
}

/** Ramalan yang sudah dinilai, terbaru lebih dahulu. */
export function riwayatRamalan(batas = 10): Ramalan[] {
  return semuaRamalan()
    .filter((x) => x.jenis === JENIS && x.sebenarnya !== undefined)
    .sort((a, b) => (a.untuk < b.untuk ? 1 : -1))
    .slice(0, batas)
}

/** Ramalan untuk besok yang belum jatuh tempo, bila ada. */
export function ramalanBesok(sekarang = Date.now()): Ramalan | null {
  const besok = kunciTanggal(new Date(sekarang + 86400_000))
  return semuaRamalan().find((x) => x.jenis === JENIS && x.untuk === besok) ?? null
}
