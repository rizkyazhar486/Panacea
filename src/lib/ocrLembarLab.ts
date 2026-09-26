// OCR foto lembar hasil lab → teks mentah, yang lalu melewati parser
// deterministik yang SUDAH ada (uraikanLembarLab, src/lib/imporLab.ts) — jalur
// yang sama dipakai jalur tempel-teks. OCR tidak pernah "mempercayai" nilai apa
// pun: ia hanya menghasilkan teks, teks itu tetap harus lolos parser + dicentang
// pengguna sebelum tersimpan (lihat src/components/ImporLembarLab.tsx).
//
// PRIVASI: foto diproses SELURUHNYA di perangkat (mesin OCR berjalan via WASM
// di browser pengguna). Foto lembar hasil lab TIDAK PERNAH diunggah ke server
// mana pun. Muatan BERAT mesin OCR (inti WASM + data model bahasa, beberapa MB)
// bukan bagian dari bundel: tesseract.js sendiri mengambilnya dari CDN publik
// (jsdelivr) lewat URL runtime hanya saat createWorker() benar-benar dipanggil
// — dibuktikan lewat build (lihat scripts/uji/ocr-lembar-lab.mts) bahwa bundel
// AWAL (entry index.html memuat) tidak berisi kode tesseract.js sama sekali.
// Tipe diambil lewat `typeof import(...)`, bukan `import type { ... } from`, agar
// modul ini tidak punya spesifier modul statis 'tesseract.js' di luar satu
// impor dinamis di bawah — pemadat (Rollup) tetap bebas menaruh potongan kecil
// pembungkus tesseract.js di potongan bersama mana pun; yang dijaga hanya
// bahwa MUATAN BERATnya tidak pernah ikut terunduh sebelum dipanggil.
type ModulTesseract = typeof import('tesseract.js')
type WorkerOcr = Awaited<ReturnType<ModulTesseract['createWorker']>>

let workerPromise: Promise<WorkerOcr> | null = null

async function ambilWorker(): Promise<WorkerOcr> {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(({ createWorker }) => createWorker('eng'))
  }
  return workerPromise
}

export interface HasilOcrLab {
  ok: boolean
  teks: string
  alasan?: string
}

/** Murni & deterministik: ubah teks mentah hasil OCR menjadi HasilOcrLab.
 *  Gagal tertutup pada teks kosong — tidak pernah mengembalikan kandidat dari
 *  ketiadaan teks. Dipisah dari bacaFotoLab agar dapat diuji tanpa mesin OCR. */
export function hasilDariTeksOcr(teksMentah: string): HasilOcrLab {
  const teks = (teksMentah ?? '').trim()
  if (!teks) {
    return { ok: false, teks: '', alasan: 'No readable text found in the photo. Try a sharper, well-lit photo, or paste the text instead.' }
  }
  return { ok: true, teks }
}

/** Uraikan foto (File/Blob) lembar hasil lab menjadi teks mentah lewat OCR
 *  di perangkat. Kegagalan mesin OCR gagal tertutup dengan alasan yang dapat
 *  dibaca — tidak pernah melempar hasil separuh jadi sebagai kandidat sah. */
export async function bacaFotoLab(gambar: Blob): Promise<HasilOcrLab> {
  try {
    const worker = await ambilWorker()
    const { data } = await worker.recognize(gambar)
    return hasilDariTeksOcr(data?.text ?? '')
  } catch {
    return { ok: false, teks: '', alasan: 'Could not read the photo (the on-device OCR engine failed to load or process it). Check your connection, or paste the text instead.' }
  }
}

/** Lepas worker OCR (mis. saat komponen impor dilepas). Aman dipanggil berkali-kali. */
export async function tutupWorkerOcrLab(): Promise<void> {
  const p = workerPromise
  workerPromise = null
  if (!p) return
  const w = await p
  await w.terminate()
}
