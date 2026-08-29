import { FITUR_DARI_HUB } from './katalogFitur'
import { WIDGETS } from './homeWidgets'
import { NAV_UNTUK_PENGATURAN } from '../components/Shell'
import { rupa, type Rupa } from './kategoriRupa'

// ─────────────────────────────────────────────────────────────────────────────
// Warna sebuah halaman, diturunkan dari alamatnya.
//
// MASALAHNYA. SectionTitle dipakai di 186 berkas. Memberi warna pada tiap
// halaman dengan menambahkan properti berarti menyunting 186 tempat, dan yang
// terlewat akan tetap abu-abu tanpa ada yang menyadarinya sampai suatu hari
// membukanya. Daftar yang harus dirawat manual selalu tertinggal — itu sudah
// tercatat dua kali di aplikasi ini, pada daftar widget beranda dan pada peta
// nama grup.
//
// JALAN KELUARNYA: halaman sudah TAHU dirinya berada di kelompok mana, sebab
// katalog fitur menyimpannya. Warnanya diturunkan dari situ, jadi halaman baru
// mendapat warnanya sendiri begitu ia didaftarkan ke katalog — tanpa menyentuh
// berkas ini sama sekali.
//
// DIBACA DARI window.location, BUKAN DARI useLocation(). Sengaja: ui.tsx
// dipakai juga di layar yang berada DI LUAR Router (halaman depan), dan hook
// router yang dipanggil di luar Router menjatuhkan seluruh layar. Membaca
// hash tidak menuntut apa pun, dan cukup: SectionTitle digambar ulang saat
// halamannya dipasang, dan halaman dipasang saat berpindah.
// ─────────────────────────────────────────────────────────────────────────────

let peta: Map<string, string> | null = null

function bangunPeta(): Map<string, string> {
  const m = new Map<string, string>()
  for (const f of FITUR_DARI_HUB) m.set(f.to, f.grup)
  // Menu didahulukan atas katalog hub: bila sebuah alamat ada di keduanya,
  // grup menu yang dipakai, sebab itu yang dilihat orang di navigasi.
  for (const n of NAV_UNTUK_PENGATURAN) m.set(n.to, n.group)
  /* Kategori widget PALING didahulukan, sebab ia yang paling halus. Grup menu
     hanya punya belasan kelompok besar, sehingga Gizi dan Tanda Tubuh sama-sama
     jatuh ke "Your Body" dan berwarna sama; kategori widget membedakan
     keduanya. Halaman yang tidak ada di daftar widget tetap memakai grup
     menunya, jadi tidak ada yang kehilangan warna. */
  for (const w of WIDGETS) m.set(w.ke.split('?')[0], w.kategori)
  return m
}

/** Alamat sekarang, tanpa tanda tanya dan tanpa garis miring di ujung. */
export function ruteSekarang(): string {
  if (typeof window === 'undefined') return '/'
  const h = window.location.hash || '#/'
  const p = h.replace(/^#/, '').split('?')[0]
  return p.length > 1 ? p.replace(/\/+$/, '') : '/'
}

export function rupaRute(rute = ruteSekarang()): Rupa {
  if (!peta) peta = bangunPeta()
  const grup = peta.get(rute)
  if (grup) return rupa(grup)
  // Cocokkan induknya: /med-study?bagian=usmle sudah dibuang tanda tanyanya,
  // tetapi /clinical-calculators/wells tetap harus mewarisi warna induknya.
  const bagian = rute.split('/').filter(Boolean)
  for (let i = bagian.length - 1; i > 0; i--) {
    const induk = '/' + bagian.slice(0, i).join('/')
    const g = peta.get(induk)
    if (g) return rupa(g)
  }
  return rupa('Home')
}
