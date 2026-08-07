// ─────────────────────────────────────────────────────────────────────────────
// Menyimpan berkas dari browser — termasuk di iPhone.
//
// Masalah yang diperbaiki: seluruh aplikasi memakai pola
//
//     const a = document.createElement('a')
//     a.download = 'nama.png'
//     a.href = url
//     a.click()
//
// dan **Safari di iOS mengabaikan atribut `download` sepenuhnya**. Bukan gagal
// dengan pesan galat — benar-benar tidak terjadi apa-apa. Pengguna iPhone
// menekan "Download to share" dan layarnya diam. Ada sebelas tombol seperti itu
// di aplikasi ini, dan semuanya mati di iPhone.
//
// Urutan yang dipakai di sini, dari yang paling baik:
//
//   1. WEB SHARE dengan berkas. Ini jalur asli iOS: muncul lembar berbagi, dan
//      pengguna bisa menyimpan ke Foto, mengirim ke WhatsApp, atau apa pun.
//      Untuk tombol yang memang bertujuan BERBAGI, ini bahkan lebih tepat
//      daripada mengunduh.
//   2. ATRIBUT download. Jalur biasa di desktop dan Android.
//   3. BUKA DI TAB BARU. Kalau keduanya tidak ada, gambar dibuka apa adanya
//      supaya masih bisa ditekan-lama lalu disimpan. Lebih baik daripada diam.
//
// Nilai baliknya menyebutkan jalur mana yang terpakai, supaya pemanggil bisa
// memberi tahu pengguna apa yang barusan terjadi — "tersimpan" dan "dibagikan"
// adalah dua hasil yang berbeda dan tidak pantas disamakan.
// ─────────────────────────────────────────────────────────────────────────────

export type HasilSimpan = 'dibagikan' | 'diunduh' | 'dibuka' | 'dibatalkan' | 'gagal'

/** Apakah lembar berbagi berkas tersedia untuk berkas ini. */
function bisaBerbagi(file: File): boolean {
  const n = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (typeof navigator.share !== 'function' || typeof n.canShare !== 'function') return false
  try { return n.canShare({ files: [file] }) } catch { return false }
}

/**
 * Simpan (atau bagikan) satu berkas.
 *
 * @param blob   isi berkasnya
 * @param nama   nama berkas, mis. "laporan.png"
 * @param judul  judul untuk lembar berbagi
 */
export async function simpanBerkas(blob: Blob, nama: string, judul?: string): Promise<HasilSimpan> {
  const file = new File([blob], nama, { type: blob.type || 'application/octet-stream' })

  // 1. Lembar berbagi — jalur asli iOS.
  if (bisaBerbagi(file)) {
    try {
      await navigator.share({ files: [file], title: judul ?? nama })
      return 'dibagikan'
    } catch (e) {
      // Pengguna menutup lembar berbagi. Itu keputusan mereka, bukan kegagalan,
      // dan TIDAK boleh diam-diam dilanjutkan dengan mengunduh berkasnya.
      if ((e as Error)?.name === 'AbortError') return 'dibatalkan'
      // Galat lain: lanjut ke jalur berikutnya.
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    // 2. Atribut download — desktop dan Android.
    const a = document.createElement('a')
    if ('download' in a) {
      a.href = url
      a.download = nama
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Dicabut belakangan: sebagian browser masih membaca URL-nya setelah klik.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      return 'diunduh'
    }

    // 3. Buka apa adanya, supaya masih bisa ditekan-lama lalu disimpan.
    const w = window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
    return w ? 'dibuka' : 'gagal'
  } catch {
    URL.revokeObjectURL(url)
    return 'gagal'
  }
}

/** Bentuk teks untuk yang isinya berupa string. */
export function simpanTeks(teks: string, nama: string, tipe = 'text/plain;charset=utf-8', judul?: string) {
  return simpanBerkas(new Blob([teks], { type: tipe }), nama, judul)
}

/** Bentuk kanvas — dipakai kartu gambar yang digambar sendiri. */
export function simpanKanvas(canvas: HTMLCanvasElement, nama: string, judul?: string): Promise<HasilSimpan> {
  return new Promise((res) => {
    canvas.toBlob((b) => {
      if (!b) { res('gagal'); return }
      void simpanBerkas(b, nama, judul).then(res)
    }, 'image/png')
  })
}

/** Kalimat singkat untuk diperlihatkan setelah menyimpan. */
export function pesanSimpan(h: HasilSimpan, nama: string): string {
  switch (h) {
    case 'dibagikan': return 'Terkirim ke lembar berbagi.'
    case 'diunduh': return `Tersimpan sebagai ${nama}.`
    case 'dibuka': return 'Dibuka di tab baru — tekan lama gambarnya untuk menyimpan.'
    case 'dibatalkan': return ''
    default: return 'Gagal menyimpan berkas.'
  }
}
