// ─────────────────────────────────────────────────────────────────────────────
// Morfologi lesi kulit — dua belas gambar potongan melintang, digambar sendiri.
//
// MENGAPA DIGAMBAR, BUKAN DIFOTO. Foto lesi yang baik hampir selalu milik atlas
// berhak cipta, dan foto yang bebas dipakai biasanya justru contoh yang tidak
// khas. Lebih dari itu: yang membedakan makula dari papula, dan papula dari
// nodul, bukanlah warnanya melainkan APAKAH IA MENONJOL DAN SEBERAPA DALAM ia
// duduk — dan itu paling jelas pada potongan melintang, yang tidak dapat
// diperlihatkan foto permukaan mana pun. Semua gambar di bawah dibuat sebagai
// SVG asli di berkas ini.
//
// YANG TIDAK DIJANJIKAN. Ini alat belajar istilah, bukan alat diagnosis. Tidak
// ada satu pun bentuk di sini yang menunjuk satu penyakit; contoh yang disebut
// hanyalah penyakit yang LAZIM menampilkan bentuk itu.
// ─────────────────────────────────────────────────────────────────────────────

interface Bentuk {
  nama: string
  batas: string
  arti: string
  contoh: string
  gambar: React.ReactNode
}

/** Lapisan kulit yang sama untuk semua gambar, supaya kedalamannya sebanding. */
function Kulit() {
  return (
    <>
      {/* dermis */}
      <rect x="0" y="34" width="120" height="26" className="fill-current text-rose-200/70 dark:text-rose-300/20" />
      {/* epidermis */}
      <rect x="0" y="26" width="120" height="8" className="fill-current text-amber-200/80 dark:text-amber-200/25" />
      {/* subkutis */}
      <rect x="0" y="60" width="120" height="10" className="fill-current text-yellow-100 dark:text-yellow-100/10" />
      <line x1="0" y1="26" x2="120" y2="26" className="stroke-current text-neutral-400/60" strokeWidth="0.8" />
      <line x1="0" y1="34" x2="120" y2="34" className="stroke-current text-neutral-400/40" strokeWidth="0.6" />
      <line x1="0" y1="60" x2="120" y2="60" className="stroke-current text-neutral-400/40" strokeWidth="0.6" />
    </>
  )
}

const ISI = 'fill-current text-brand/70'
const GARIS = 'stroke-current text-brand'

const BENTUK: Bentuk[] = [
  {
    nama: 'Makula', batas: '< 1 cm', arti: 'Perubahan WARNA saja — rata, tidak teraba bila mata ditutup.',
    contoh: 'Bercak café-au-lait, vitiligo dini, petekie',
    gambar: <rect x="45" y="26" width="30" height="8" className="fill-current text-brand/60" />,
  },
  {
    nama: 'Patch', batas: '> 1 cm', arti: 'Makula yang lebih luas. Tetap rata; hanya ukurannya yang berbeda.',
    contoh: 'Melasma, vitiligo lanjut',
    gambar: <rect x="20" y="26" width="80" height="8" className="fill-current text-brand/60" />,
  },
  {
    nama: 'Papula', batas: '< 1 cm', arti: 'MENONJOL dan padat. Seluruhnya berada di atas atau dalam epidermis–dermis atas.',
    contoh: 'Liken planus, akne papular, kutil datar',
    gambar: <path d="M48 26 Q60 12 72 26 Z" className={ISI} />,
  },
  {
    nama: 'Plak', batas: '> 1 cm', arti: 'Menonjol tetapi DATAR di atasnya — seperti dataran tinggi, bukan bukit.',
    contoh: 'Psoriasis, dermatitis numular',
    gambar: <path d="M28 26 L32 17 L88 17 L92 26 Z" className={ISI} />,
  },
  {
    nama: 'Nodul', batas: '> 1 cm', arti: 'Menonjol dan padat, tetapi duduk LEBIH DALAM — sampai dermis dalam atau subkutis. Lebih terasa daripada terlihat.',
    contoh: 'Eritema nodosum, kista epidermoid, limfoma kulit',
    gambar: <ellipse cx="60" cy="38" rx="20" ry="16" className={ISI} />,
  },
  {
    nama: 'Vesikel', batas: '< 1 cm', arti: 'Rongga berisi CAIRAN JERNIH di dalam atau di bawah epidermis.',
    contoh: 'Herpes simpleks, varisela, dermatitis kontak akut',
    gambar: (
      <>
        <path d="M48 26 Q60 10 72 26 Z" className="fill-current text-sky-200 dark:text-sky-300/40" />
        <path d="M48 26 Q60 10 72 26" className={GARIS} strokeWidth="1.2" fill="none" />
      </>
    ),
  },
  {
    nama: 'Bula', batas: '> 1 cm', arti: 'Vesikel besar. Letak atapnya menentukan seberapa mudah ia pecah.',
    contoh: 'Pemfigus (atap tipis, mudah pecah), pemfigoid bulosa (atap tegang)',
    gambar: (
      <>
        <path d="M30 26 Q60 2 90 26 Z" className="fill-current text-sky-200 dark:text-sky-300/40" />
        <path d="M30 26 Q60 2 90 26" className={GARIS} strokeWidth="1.2" fill="none" />
      </>
    ),
  },
  {
    nama: 'Pustula', batas: 'ukuran apa pun', arti: 'Rongga berisi NANAH. Isinya tidak selalu berarti infeksi — psoriasis pustulosa steril.',
    contoh: 'Akne pustular, folikulitis, psoriasis pustulosa',
    gambar: (
      <>
        <path d="M48 26 Q60 10 72 26 Z" className="fill-current text-amber-300 dark:text-amber-300/60" />
        <path d="M48 26 Q60 10 72 26" className="stroke-current text-amber-600" strokeWidth="1.2" fill="none" />
      </>
    ),
  },
  {
    nama: 'Urtika (wheal)', batas: 'berpindah', arti: 'Tonjolan edema yang PINDAH TEMPAT dan hilang dalam hitungan jam. Yang bertahan lebih dari 24 jam di satu tempat bukan urtikaria biasa.',
    contoh: 'Urtikaria akut; bila menetap > 24 jam pikirkan vaskulitis urtikarial',
    gambar: (
      <>
        <path d="M34 26 Q46 14 58 26 Q70 14 86 26 Z" className="fill-current text-rose-300/70" />
        <path d="M34 26 Q46 14 58 26 Q70 14 86 26" className="stroke-current text-rose-500" strokeWidth="1" fill="none" strokeDasharray="3 2" />
      </>
    ),
  },
  {
    nama: 'Skuama', batas: '—', arti: 'Penumpukan stratum korneum yang terlepas — sisik di PERMUKAAN, bukan lapisan yang hilang.',
    contoh: 'Psoriasis (tebal keperakan), dermatitis seboroik (berminyak)',
    gambar: (
      <>
        {[36, 50, 64, 78].map((x) => (
          <path key={x} d={`M${x} 26 l10 -5 l0 5 Z`} className="fill-current text-neutral-400/80" />
        ))}
      </>
    ),
  },
  {
    nama: 'Erosi', batas: '—', arti: 'Kehilangan epidermis SAJA. Sembuh tanpa jaringan parut — itulah pembedanya dari ulkus.',
    contoh: 'Bula yang pecah, impetigo',
    gambar: <path d="M40 26 Q50 33 60 33 Q70 33 80 26 L80 26 L40 26 Z" className="fill-current text-rose-300/80" />,
  },
  {
    nama: 'Ulkus', batas: '—', arti: 'Kehilangan sampai DERMIS atau lebih dalam. Meninggalkan jaringan parut.',
    contoh: 'Ulkus diabetik, ulkus vena, ulkus tekan',
    gambar: (
      <>
        <path d="M40 26 L46 48 Q60 56 74 48 L80 26 Z" className="fill-current text-rose-400/80" />
        <path d="M40 26 L46 48 Q60 56 74 48 L80 26" className="stroke-current text-rose-600" strokeWidth="1" fill="none" />
      </>
    ),
  },
]

export function MorfologiLesi() {
  return (
    <section className="kaca rounded-3xl p-4">
      <h2 className="text-sm font-black uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
        Morfologi lesi primer — potongan melintang
      </h2>
      <p className="mt-1 text-[11px] leading-snug text-neutral-500">
        Yang membedakan makula dari papula, dan papula dari nodul, bukan warnanya melainkan apakah ia menonjol dan
        seberapa dalam ia duduk — dan itu hanya terlihat pada potongan melintang. Kuning muda di atas adalah epidermis,
        merah muda dermis, kuning pucat subkutis. Gambar dibuat sendiri sebagai SVG; tidak ada foto pasien.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {BENTUK.map((b) => (
          <div key={b.nama} className="rounded-2xl border border-neutral-200 p-3 dark:border-white/10">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-black text-ink dark:text-white">{b.nama}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{b.batas}</span>
            </div>
            <svg viewBox="0 0 120 70" className="mt-2 h-20 w-full rounded-lg bg-white/40 dark:bg-white/5" role="img" aria-label={`Potongan melintang ${b.nama}`}>
              <Kulit />
              {b.gambar}
            </svg>
            <p className="mt-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">{b.arti}</p>
            <p className="mt-1 text-[10px] leading-snug text-neutral-400">Lazim pada: {b.contoh}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-snug text-neutral-500">
        Ini alat belajar istilah, bukan alat diagnosis. Tidak ada satu bentuk pun yang menunjuk satu penyakit — yang
        disebut hanyalah penyakit yang lazim menampilkan bentuk itu, dan banyak penyakit menampilkan beberapa bentuk
        sekaligus pada tahap yang berbeda.
      </p>
    </section>
  )
}

export default MorfologiLesi
