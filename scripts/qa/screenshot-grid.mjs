// F2 / Task 45 — logika murni regresi tangkapan layar (tanpa browser/jaringan) supaya dapat diuji.
// Piksel mentah berbeda antar mesin render (kontras lokal 83 vs CI 91), jadi yang dibandingkan adalah grid luminans KASAR
// (rata-rata per sel) dengan toleransi eksplisit: menangkap layar kosong, blok bergeser/hilang, tema terbalik; bukan perbedaan antialias.
export const KOLOM = 8
export const BARIS = 12
export const TOL_SEL = 40 // selisih luminans (0-255) per sel yang masih dianggap derau render
export const MAKS_SEL_MENYIMPANG = 6 // jumlah sel (dari 96) yang boleh melewati TOL_SEL sebelum dianggap regresi
export const TOL_RATA = 12 // selisih rata-rata mutlak seluruh sel

const luminans = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b

/** RGBA (Uint8ClampedArray, w*h*4) -> grid KOLOM*BARIS rata-rata luminans (bilangan bulat). Input tak sahih -> null (fail-closed). */
export const gridDari = (rgba, w, h, kolom = KOLOM, baris = BARIS) => {
  if (!rgba || !Number.isInteger(w) || !Number.isInteger(h) || w < kolom || h < baris || rgba.length !== w * h * 4) return null
  const jumlah = new Array(kolom * baris).fill(0)
  const cacah = new Array(kolom * baris).fill(0)
  for (let y = 0; y < h; y++) {
    const by = Math.min(baris - 1, Math.floor((y * baris) / h))
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const s = by * kolom + Math.min(kolom - 1, Math.floor((x * kolom) / w))
      jumlah[s] += luminans(rgba[i], rgba[i + 1], rgba[i + 2]); cacah[s]++
    }
  }
  return jumlah.map((j, s) => Math.round(j / cacah[s]))
}

const sahih = (g) => Array.isArray(g) && g.length === KOLOM * BARIS && g.every((v) => Number.isFinite(v) && v >= 0 && v <= 255)

/** Bandingkan grid ukur vs baseline. Kembalikan daftar alasan gagal (kosong = lulus). Fail-closed bila salah satu tak sahih. */
export const bandingkanGrid = (ukur, base) => {
  if (!sahih(base)) return ['grid baseline tidak ada atau tidak valid (fail-closed)']
  if (!sahih(ukur)) return ['grid terukur tidak valid (fail-closed)']
  let jumlahSelisih = 0, menyimpang = 0
  for (let i = 0; i < ukur.length; i++) { const d = Math.abs(ukur[i] - base[i]); jumlahSelisih += d; if (d > TOL_SEL) menyimpang++ }
  const rata = jumlahSelisih / ukur.length
  const gagal = []
  if (menyimpang > MAKS_SEL_MENYIMPANG) gagal.push(`${menyimpang} sel menyimpang > ${TOL_SEL} (maks ${MAKS_SEL_MENYIMPANG})`)
  if (rata > TOL_RATA) gagal.push(`selisih rata-rata ${rata.toFixed(1)} > ${TOL_RATA}`)
  return gagal
}

/** Bandingkan seluruh peta kunci->grid. Kunci baseline yang hilang dari ukuran, atau ukuran baru tanpa baseline, juga gagal. */
export const bandingkanSemua = (ukur, baseline) => {
  if (!baseline || typeof baseline.grid !== 'object' || baseline.grid === null || Object.keys(baseline.grid).length === 0) return ['SHOT_BASELINE tidak ada atau kosong: gerbang tidak dapat dinilai (fail-closed)']
  const gagal = []
  for (const k of Object.keys(baseline.grid)) { if (!(k in ukur)) gagal.push(`${k}: tidak terukur`) }
  for (const [k, g] of Object.entries(ukur)) {
    if (!(k in baseline.grid)) { gagal.push(`${k}: tidak ada di baseline`); continue }
    for (const a of bandingkanGrid(g, baseline.grid[k])) gagal.push(`${k}: ${a}`)
  }
  return gagal
}
