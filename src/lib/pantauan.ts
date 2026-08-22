// Daftar pantauan — butir apa pun di dalam aplikasi yang dipilih sendiri untuk
// selalu terlihat di beranda.
//
// MENGAPA DAFTAR PILIHAN SENDIRI, BUKAN "SERING DIBUKA". Menebak dari
// kebiasaan terdengar pintar tetapi salah pada saat yang paling penting:
// menjelang ujian, yang perlu diulang justru yang JARANG dibuka karena belum
// dikuasai. Daftar yang dipilih sendiri tidak pernah salah menebak.
//
// SATU TEMPAT UNTUK SEMUA JENIS. Penyakit, obat, kalkulator, stasiun, dan
// fitur disimpan dalam satu daftar dengan bentuk yang sama. Memisahkannya per
// jenis berarti pemakainya harus ingat di daftar mana ia menaruh sesuatu.

const KUNCI = 'pmd-pantauan-v1'
const BATAS = 40

export interface Pantauan {
  jenis: string
  judul: string
  ke: string
}

function baca(): Pantauan[] {
  try {
    const arr = JSON.parse(localStorage.getItem(KUNCI) || '[]')
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (p): p is Pantauan =>
        !!p && typeof p.judul === 'string' && typeof p.ke === 'string' && typeof p.jenis === 'string',
    )
  } catch {
    return []
  }
}

function tulis(daftar: Pantauan[]): Pantauan[] {
  const potong = daftar.slice(0, BATAS)
  try { localStorage.setItem(KUNCI, JSON.stringify(potong)) } catch { /* kuota penuh */ }
  try { window.dispatchEvent(new Event('panacea:pantauan')) } catch { /* ignore */ }
  return potong
}

export function ambilPantauan(): Pantauan[] {
  return baca()
}

export function dipantau(ke: string): boolean {
  return baca().some((p) => p.ke === ke)
}

/** Menambah bila belum ada, membuang bila sudah. Yang baru ditaruh di DEPAN. */
export function alihkanPantauan(p: Pantauan): Pantauan[] {
  const kini = baca()
  const ada = kini.some((x) => x.ke === p.ke)
  return tulis(ada ? kini.filter((x) => x.ke !== p.ke) : [p, ...kini])
}

export function hapusPantauan(ke: string): Pantauan[] {
  return tulis(baca().filter((p) => p.ke !== ke))
}
