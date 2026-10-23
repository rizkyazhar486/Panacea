// Logika murni audit keyboard (tanpa browser) supaya dapat diuji. Dipakai oleh scripts/qa/keyboard-audit.mjs.
// Satu langkah = satu penekanan Tab: { hilang: bool, key: string, terlihat: bool, indikator: bool }.
// `hilang` = fokus mendarat di <body>/dokumen; itu NORMAL saat urutan Tab berputar kembali ke peramban, jadi tidak digerbang.

/** Segmen satu <input type=time>/<date> memakai beberapa Tab pada elemen yang sama: batas aman 6 (jam, menit, AM/PM + cadangan). */
export const BATAS_BERURUTAN_SAMA = 6

/** Hitung metrik dari urutan langkah Tab pada satu halaman. */
export const analisisFokus = (langkah) => {
  if (!Array.isArray(langkah)) throw new TypeError('langkah harus berupa array')
  const nyata = langkah.filter((l) => !l.hilang)
  let berurutan = 0
  let terpanjang = 0
  let sebelumnya = null
  for (const l of langkah) {
    if (l.hilang) { sebelumnya = null; berurutan = 0; continue }
    berurutan = l.key === sebelumnya ? berurutan + 1 : 1
    sebelumnya = l.key
    if (berurutan > terpanjang) terpanjang = berurutan
  }
  return {
    langkah: langkah.length,
    unik: new Set(nyata.map((l) => l.key)).size,
    tanpaIndikator: nyata.filter((l) => !l.indikator).length,
    takTerlihat: nyata.filter((l) => !l.terlihat).length,
    terjebak: terpanjang > BATAS_BERURUTAN_SAMA ? 1 : 0,
    // Halaman yang punya kontrol tetapi Tab tidak pernah mendarat di satu pun: fokus tidak dapat dijangkau dengan keyboard.
    tanpaStopFokus: nyata.length === 0 ? 1 : 0,
  }
}

const KUNCI = ['tanpaIndikator', 'takTerlihat', 'terjebak', 'tanpaStopFokus']

/** Bandingkan total terukur dengan baseline; kosong = lulus. Fail-closed tanpa baseline valid. */
export const bandingkanKeyboard = (total, baseline) => {
  if (!baseline || KUNCI.some((k) => !Number.isFinite(baseline[k]))) return ['KEYBOARD_BASELINE tidak ada atau tidak valid: gerbang tidak dapat dinilai (fail-closed)']
  const gagal = []
  for (const k of KUNCI) {
    if (!Number.isFinite(total[k])) gagal.push(`metrik ${k} tidak terukur`)
    else if (total[k] > baseline[k]) gagal.push(`${k} naik: ${total[k]} > baseline ${baseline[k]}`)
  }
  return gagal
}
