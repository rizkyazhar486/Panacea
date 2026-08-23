// Pembacaan suara (text-to-speech) memakai mesin bawaan perangkat.
//
// MENGAPA BUKAN LAYANAN SUARA BERBAYAR. Suara buatan yang enak didengar
// (ElevenLabs dan sejenisnya) menuntut kunci API, biaya per huruf, dan
// PENGIRIMAN TEKSNYA KE SERVER PIHAK KETIGA. Untuk aplikasi yang membacakan
// catatan penyakit dan ayat, ketiganya sekaligus tidak sepadan: mesin bawaan
// peramban sudah ada di hampir semua ponsel, gratis, tanpa kunci, dan tidak
// mengirim satu huruf pun keluar dari perangkat.
//
// Yang ditukar: suaranya lebih datar. Itu disebutkan apa adanya di layar
// alih-alih dipoles, karena orang yang mengira ini suara manusia akan kecewa
// pada kalimat kedua.
//
// DIPOTONG PER KALIMAT, dan ini bukan hiasan. Peramban seluler memutus
// pembacaan yang lebih panjang dari kira-kira 200-300 aksara tanpa memberi
// tahu — gejalanya: paragraf berhenti di tengah dan tidak pernah dilanjutkan.
// Karena itu teksnya dipecah per kalimat, diantrikan sendiri, dan potongan
// berikutnya baru dimulai sesudah yang sekarang benar-benar selesai.
//
// BAHASA DIMINTA id-ID LEBIH DAHULU. Bila perangkat tidak punya suara
// Indonesia, dipakai suara mana pun yang ada — melafalkan bahasa Indonesia
// dengan suara Inggris masih jauh lebih berguna daripada diam.

export interface KeadaanBaca {
  jalan: boolean
  /** Potongan ke berapa dari seluruh teks. */
  bagian: number
  jumlah: number
}

type Pendengar = (k: KeadaanBaca) => void

const pendengar = new Set<Pendengar>()
let antrean: string[] = []
let indeks = 0
let jalan = false
let laju = 1

const KUNCI_LAJU = 'pmd_baca_laju_v1'

export function didukung(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function ambilLaju(): number {
  try {
    const v = Number(localStorage.getItem(KUNCI_LAJU))
    if (Number.isFinite(v) && v >= 0.5 && v <= 2) { laju = v; return v }
  } catch { /* abaikan */ }
  return laju
}

export function aturLaju(v: number): void {
  laju = Math.max(0.5, Math.min(2, v))
  try { localStorage.setItem(KUNCI_LAJU, String(laju)) } catch { /* kuota */ }
  // Laju hanya berlaku pada potongan berikutnya: mengubahnya di tengah
  // potongan menuntut membatalkan dan mengulang kalimat yang sedang dibaca,
  // dan kalimat yang tiba-tiba diulang lebih mengganggu daripada laju yang
  // baru berubah beberapa detik kemudian.
}

export function langganan(p: Pendengar): () => void {
  pendengar.add(p)
  return () => pendengar.delete(p)
}

function kabari() {
  const k: KeadaanBaca = { jalan, bagian: indeks, jumlah: antrean.length }
  for (const p of pendengar) p(k)
}

/**
 * Pecah teks menjadi potongan siap-baca.
 *
 * Batas potongan diambil pada akhir kalimat; kalimat yang tetap terlalu
 * panjang dipecah lagi pada koma. Yang tidak dilakukan: memotong di tengah
 * kata, karena mesin suara akan melafalkan pecahannya sebagai kata lain.
 */
export function pecah(teks: string, maks = 220): string[] {
  const bersih = teks
    .replace(/\s+/g, ' ')
    .replace(/[•·]/g, '. ')
    .trim()
  if (!bersih) return []

  const kalimat = bersih.match(/[^.!?]+[.!?]*/g) ?? [bersih]
  const out: string[] = []
  let kini = ''
  for (const k of kalimat) {
    const potong = k.trim()
    if (!potong) continue
    if ((kini + ' ' + potong).trim().length <= maks) {
      kini = (kini + ' ' + potong).trim()
      continue
    }
    if (kini) { out.push(kini); kini = '' }
    if (potong.length <= maks) { kini = potong; continue }
    // Kalimat tunggal yang kepanjangan: dipecah pada koma, lalu pada spasi.
    let sisa = potong
    while (sisa.length > maks) {
      const potongKoma = sisa.lastIndexOf(',', maks)
      const potongSpasi = sisa.lastIndexOf(' ', maks)
      const batas = potongKoma > maks * 0.5 ? potongKoma + 1 : potongSpasi > 0 ? potongSpasi : maks
      out.push(sisa.slice(0, batas).trim())
      sisa = sisa.slice(batas).trim()
    }
    kini = sisa
  }
  if (kini) out.push(kini)
  return out
}

function suaraIndonesia(): SpeechSynthesisVoice | null {
  const semua = window.speechSynthesis.getVoices()
  return (
    semua.find((v) => v.lang?.toLowerCase().startsWith('id')) ??
    semua.find((v) => v.lang?.toLowerCase().startsWith('ms')) ??
    null
  )
}

function ucapkan() {
  if (!didukung() || indeks >= antrean.length) {
    jalan = false
    indeks = 0
    kabari()
    return
  }
  const u = new SpeechSynthesisUtterance(antrean[indeks])
  const v = suaraIndonesia()
  if (v) u.voice = v
  u.lang = v?.lang ?? 'id-ID'
  u.rate = laju
  u.onend = () => {
    if (!jalan) return
    indeks += 1
    kabari()
    ucapkan()
  }
  // Kegagalan satu potongan tidak menghentikan seluruh bacaan: dilanjutkan ke
  // potongan berikutnya, karena berhenti diam-diam di tengah paragraf terbaca
  // sebagai aplikasi yang rusak.
  u.onerror = () => {
    if (!jalan) return
    indeks += 1
    kabari()
    ucapkan()
  }
  window.speechSynthesis.speak(u)
}

export function mulai(teks: string): void {
  if (!didukung()) return
  hentikan()
  antrean = pecah(teks)
  indeks = 0
  if (!antrean.length) return
  jalan = true
  ambilLaju()
  kabari()
  // Sebagian peramban baru memuat daftar suara sesudah peristiwa voiceschanged;
  // sekali coba lagi sesudah jeda pendek sudah cukup untuk mendapat suara
  // Indonesia pada pemutaran pertama.
  if (!window.speechSynthesis.getVoices().length) {
    setTimeout(() => { if (jalan) ucapkan() }, 250)
  } else {
    ucapkan()
  }
}

export function hentikan(): void {
  if (!didukung()) return
  jalan = false
  indeks = 0
  antrean = []
  try { window.speechSynthesis.cancel() } catch { /* abaikan */ }
  kabari()
}

export function jeda(): void {
  if (!didukung() || !jalan) return
  try { window.speechSynthesis.pause() } catch { /* abaikan */ }
  jalan = false
  kabari()
}

export function lanjut(): void {
  if (!didukung()) return
  jalan = true
  try { window.speechSynthesis.resume() } catch { /* abaikan */ }
  kabari()
}

export function sedangJalan(): boolean {
  return jalan
}
