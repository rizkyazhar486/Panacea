// ─────────────────────────────────────────────────────────────────────────────
// Rangka muat — pengganti tulisan "Loading…".
//
// Alasannya bukan keindahan melainkan TATA LETAK YANG TIDAK MELOMPAT. Tulisan
// "Loading…" setinggi satu baris digantikan isi setinggi ribuan piksel begitu
// data datang; halaman melompat, dan jari yang sedang bergerak menuju sebuah
// tombol mendarat pada tombol yang berbeda. Ini bukan soal rasa — di halaman
// yang memuat dosis obat, salah ketuk berarti membuka penyakit yang salah.
//
// Karena itu setiap rangka di sini dibuat menyerupai TINGGI ISI YANG AKAN
// MENGGANTIKANNYA, bukan sekadar kotak abu-abu seukuran seadanya.
//
// AKSESIBILITAS: seluruh rangka diberi aria-hidden dan pembungkusnya diberi
// role="status" dengan tulisan yang hanya terbaca pembaca layar. Tanpa itu
// pembaca layar akan membacakan puluhan kotak kosong; dengan itu ia cukup
// mengucapkan satu kali bahwa isi sedang dimuat.
// ─────────────────────────────────────────────────────────────────────────────

/** Satu batang rangka. Lebar dalam persen supaya ikut lebar induknya. */
export function Batang({ w = '100%', h = 12, kelas = '' }: { w?: string; h?: number; kelas?: string }) {
  return <span className={`block rangka ${kelas}`} style={{ width: w, height: h }} aria-hidden="true" />
}

/** Pembungkus: satu pengumuman untuk pembaca layar, bukan puluhan. */
export function Memuat({ label = 'Memuat isi', children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

/**
 * Rangka satu kartu: judul, dua baris tulisan, dan sebaris angka.
 *
 * Tingginya sengaja mendekati kartu isi yang sesungguhnya (±120 px), bukan
 * sekadar kotak kecil — kotak kecil justru memperbesar lompatan tata letak
 * alih-alih mencegahnya.
 */
export function RangkaKartu({ baris = 2 }: { baris?: number }) {
  return (
    <div className="kaca rounded-3xl p-4">
      <div className="flex items-center gap-3">
        <span className="rangka h-10 w-10 shrink-0 rounded-2xl" aria-hidden="true" />
        <span className="min-w-0 flex-1 space-y-2">
          <Batang w="58%" h={13} />
          <Batang w="34%" h={10} />
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: baris }).map((_, i) => (
          // Baris terakhir dibuat lebih pendek. Paragraf sungguhan hampir tidak
          // pernah berakhir tepat di tepi kanan, dan rangka yang seluruh
          // barisnya rata kanan terbaca sebagai tabel, bukan sebagai tulisan.
          <Batang key={i} w={i === baris - 1 ? '62%' : '100%'} h={10} />
        ))}
      </div>
    </div>
  )
}

/** Rangka daftar kartu. */
export function RangkaDaftar({ jumlah = 3, baris = 2 }: { jumlah?: number; baris?: number }) {
  return (
    <Memuat>
      <div className="space-y-3">
        {Array.from({ length: jumlah }).map((_, i) => (
          <RangkaKartu key={i} baris={baris} />
        ))}
      </div>
    </Memuat>
  )
}

/** Rangka baris angka di puncak halaman — sepadan dengan PanelAngka. */
export function RangkaAngka({ jumlah = 4 }: { jumlah?: number }) {
  return (
    <Memuat label="Memuat angka">
      <div className="flex gap-[6px]">
        {Array.from({ length: jumlah }).map((_, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col gap-[6px] rounded-2xl bg-white/70 p-3 dark:bg-white/5">
            <Batang w="72%" h={9} />
            <Batang w="52%" h={20} />
            <Batang w="100%" h={16} />
          </div>
        ))}
      </div>
    </Memuat>
  )
}

/**
 * Rangka satu halaman penuh: judul, baris angka, deretan keping, lalu kartu.
 *
 * Dipakai sebagai fallback Suspense untuk halaman yang dimuat malas. Urutan
 * bloknya sengaja mengikuti urutan yang dipakai hampir seluruh halaman di
 * aplikasi ini, sehingga apa pun yang dimuat, yang muncul kemudian mendarat
 * di tempat yang kurang lebih sama.
 */
export function RangkaHalaman({ angka = true, keping = true, kartu = 3 }: {
  angka?: boolean; keping?: boolean; kartu?: number
}) {
  return (
    <Memuat label="Memuat halaman">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="rangka h-11 w-11 shrink-0 rounded-2xl" aria-hidden="true" />
          <span className="min-w-0 flex-1 space-y-2">
            <Batang w="46%" h={17} />
            <Batang w="72%" h={11} />
          </span>
        </div>

        {angka && (
          <div className="flex gap-[6px]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col gap-[6px] rounded-2xl bg-white/70 p-3 dark:bg-white/5">
                <Batang w="72%" h={9} />
                <Batang w="52%" h={20} />
                <Batang w="100%" h={16} />
              </div>
            ))}
          </div>
        )}

        {keping && (
          <div className="flex gap-1.5">
            {[86, 104, 92, 78].map((w, i) => (
              <span key={i} className="rangka h-10 shrink-0 rounded-full" style={{ width: w }} aria-hidden="true" />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {Array.from({ length: kartu }).map((_, i) => (
            <RangkaKartu key={i} />
          ))}
        </div>
      </div>
    </Memuat>
  )
}

export default RangkaHalaman
