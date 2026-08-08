// ─────────────────────────────────────────────────────────────────────────────
// Kilau — pantulan cahaya yang mengikuti gerak, ciri utama "liquid glass".
//
// Yang membuat kaca terlihat seperti kaca bukan buramnya latar belakang,
// melainkan PANTULAN YANG BERGESER saat sudut pandang berubah. Permukaan yang
// buram tetapi pantulannya diam terbaca sebagai plastik.
//
// Tiga keputusan penting, semuanya soal biaya:
//
// 1. SATU PENDENGAR UNTUK SELURUH HALAMAN, bukan satu per kartu. Halaman ini
//    bisa memuat puluhan kartu; memasang pointermove di masing-masing berarti
//    puluhan penangan berebut setiap gerakan tetikus. Di sini satu pendengar di
//    document mencari kartu terdekat lewat closest(), lalu menulis dua variabel
//    CSS di elemen itu saja.
//
// 2. PENULISAN DIBATASI KE SATU BINGKAI. pointermove menyala jauh lebih sering
//    daripada layar digambar ulang; tanpa requestAnimationFrame kita menulis
//    gaya berkali-kali untuk bingkai yang sama dan memaksa layout berulang.
//
// 3. DI LAYAR SENTUH TIDAK ADA KURSOR, jadi pantulannya digerakkan oleh GULIRAN.
//    Ini bukan tiruan yang malas: di ponsel, sudut pandang memang berubah saat
//    konten bergerak. Sensor kemiringan sengaja tidak dipakai — di iOS ia
//    menuntut izin lewat dialog, dan meminta izin gerak hanya demi hiasan
//    adalah pertukaran yang buruk.
//
// Seluruhnya mati bila pengguna meminta gerak dikurangi. Bagi sebagian orang
// gerak halus bukan sekadar selera — ia memicu mual dan migrain.
// ─────────────────────────────────────────────────────────────────────────────

const KELAS = '.kaca'

export function pasangKilau(): () => void {
  if (typeof window === 'undefined') return () => {}

  const kurangiGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  if (kurangiGerak?.matches) return () => {}

  let bingkai = 0
  let terakhir: HTMLElement | null = null
  let px = 0, py = 0

  const gambar = () => {
    bingkai = 0
    if (!terakhir) return
    terakhir.style.setProperty('--kx', px.toFixed(1) + '%')
    terakhir.style.setProperty('--ky', py.toFixed(1) + '%')
  }

  const gerakPenunjuk = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.(KELAS) as HTMLElement | null
    if (el !== terakhir) {
      // Kartu yang ditinggalkan dikembalikan ke tengah, supaya pantulannya
      // tidak membeku di posisi terakhir kursor.
      terakhir?.style.removeProperty('--kx')
      terakhir?.style.removeProperty('--ky')
      terakhir = el
    }
    if (!el) return
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) return
    px = ((e.clientX - r.left) / r.width) * 100
    py = ((e.clientY - r.top) / r.height) * 100
    if (!bingkai) bingkai = requestAnimationFrame(gambar)
  }

  // Sentuh: pantulan mengikuti posisi gulir, dinormalkan ke 0–100.
  let bingkaiGulir = 0
  const gulir = () => {
    bingkaiGulir = 0
    const tinggi = document.documentElement.scrollHeight - window.innerHeight
    const maju = tinggi > 0 ? (window.scrollY / tinggi) * 100 : 50
    document.documentElement.style.setProperty('--kilau-gulir', maju.toFixed(1) + '%')
  }
  const gulirTerjadwal = () => { if (!bingkaiGulir) bingkaiGulir = requestAnimationFrame(gulir) }

  const adaPenunjuk = window.matchMedia?.('(pointer: fine)')?.matches ?? false
  if (adaPenunjuk) window.addEventListener('pointermove', gerakPenunjuk, { passive: true })
  else {
    window.addEventListener('scroll', gulirTerjadwal, { passive: true })
    gulir()
  }

  return () => {
    if (bingkai) cancelAnimationFrame(bingkai)
    if (bingkaiGulir) cancelAnimationFrame(bingkaiGulir)
    window.removeEventListener('pointermove', gerakPenunjuk)
    window.removeEventListener('scroll', gulirTerjadwal)
    terakhir?.style.removeProperty('--kx')
    terakhir?.style.removeProperty('--ky')
  }
}

export default pasangKilau
