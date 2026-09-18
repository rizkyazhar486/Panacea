// Satu katalog, dua pemakai.
//
// Aplikasi ini menyimpan kapabilitasnya di DUA tempat yang tumbuh terpisah:
// FITUR_DARI_HUB (135 kapabilitas produk) dan NAV_UNTUK_PENGATURAN (79 tujuan
// menu, termasuk akun, langganan, admin dan hukum). Halaman "All Features"
// sudah menggabungkan keduanya; Beranda tidak, dan karena itu 56 tujuan —
// termasuk Kartu Darurat, Pengaturan, Apotek dan Pengingat Obat — tidak pernah
// muncul di indeks Beranda sama sekali.
//
// Selama penggabungannya ditulis ulang di setiap pemakai, keduanya akan
// menyimpang: satu daftar mendapat tujuan baru, yang lain tidak, dan tidak ada
// yang gagal saat itu terjadi. Fungsi ini menjadi satu-satunya tempat
// penggabungan itu terjadi.
//
// Ditulis sebagai fungsi murni yang MENERIMA kedua daftar alih-alih
// mengimpornya: NAV_UNTUK_PENGATURAN tinggal di dalam Shell.tsx, yang menarik
// React dan stylesheet, sehingga mengimpornya di sini akan membuat berkas ini
// tidak dapat dimuat oleh gerbang Node.

export interface EntriKatalog {
  /** Rute — DATA, bukan teks. Tidak pernah diterjemahkan. */
  to: string
  label: string
  group: string
  /** Kata kunci untuk pencarian; kosong untuk tujuan menu. */
  kw: string
  apa: string
  /** Kosong berarti terbuka untuk semua peran. */
  roles: readonly string[]
}

export interface SumberHub {
  to: string
  nama: string
  apa?: string
  kw?: string
  grup?: string
}

export interface SumberNav {
  to: string
  label: string
  group: string
  roles: readonly string[]
}

/**
 * Menggabungkan katalog kapabilitas dengan daftar tujuan menu.
 *
 * Entri menu menang atas entri hub pada rute yang sama, karena labelnya adalah
 * yang sudah dibaca orang di menu — tetapi keterangan dan kata kunci milik hub
 * DIPERTAHANKAN, kalau tidak rute yang ada di kedua daftar justru kehilangan
 * kemampuan dicarinya begitu digabungkan.
 */
export function gabungKatalog(hub: readonly SumberHub[], nav: readonly SumberNav[]): EntriKatalog[] {
  const peta = new Map<string, EntriKatalog>()
  for (const f of hub) {
    peta.set(f.to, {
      to: f.to,
      label: f.nama,
      group: f.grup ?? 'Other',
      kw: `${f.apa ?? ''} ${f.kw ?? ''}`.trim(),
      apa: f.apa ?? '',
      roles: [],
    })
  }
  for (const n of nav) {
    const ada = peta.get(n.to)
    peta.set(n.to, {
      to: n.to,
      label: n.label,
      group: n.group,
      kw: ada?.kw ?? '',
      apa: ada?.apa ?? '',
      roles: n.roles,
    })
  }
  return [...peta.values()]
}

/**
 * Menyaring menurut peran.
 *
 * Daftar peran yang KOSONG berarti terbuka untuk semua — itulah bentuk seluruh
 * entri yang berasal dari hub. Membacanya sebagai "tidak ada peran yang boleh"
 * akan mengosongkan indeks Beranda sepenuhnya.
 */
export function saringPeran(entri: readonly EntriKatalog[], peran: string): EntriKatalog[] {
  return entri.filter((n) => n.roles.length === 0 || n.roles.includes(peran))
}

/**
 * Beberapa rute lama kini hidup sebagai tampilan di dalam super-page.
 *
 * Pemetaan ini adalah DATA, bukan teks: kunci dan nilainya adalah rute yang
 * dibandingkan dengan `===` di tempat lain, jadi tidak pernah diterjemahkan.
 * Ia tinggal di sini, bukan di dalam komponen Beranda, supaya gerbang dapat
 * menghitung keterjangkauan dengan cara yang PERSIS sama dengan yang dipakai
 * layar — hitungan yang memakai aturan berbeda dari layarnya tidak membuktikan
 * apa pun tentang layar itu.
 */
export const RUTE_KANONIK: Readonly<Record<string, string>> = {
  '/feed': '/?t=social',
  '/community': '/?t=community',
  '/clubs': '/?t=clubs',
  '/sports-scores': '/?t=scores',
  '/scripture': '/?t=religion&faith=scripture',
  '/hadith': '/?t=religion&faith=hadith',
  '/prayer-times': '/?t=religion&faith=prayer',
  '/prophet-stories': '/?t=religion&faith=stories',
  '/body-explorer': '/learn?t=body',
  '/radiology': '/learn?t=radiology',
  '/med-study': '/learn?t=library',
  '/clinical-calculators': '/learn?t=calculators',
  '/latihan': '/fitness-hub?view=training',
  '/workout': '/fitness-hub?view=workout&t=sesi',
  '/recovery': '/fitness-hub?view=recovery',
  '/nutrition': '/fitness-hub?view=nutrition',
  '/health-data': '/fitness-hub?view=health-data',
}

export function rutaKanonik(to: string): string {
  return RUTE_KANONIK[to] ?? to
}
