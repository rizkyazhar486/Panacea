import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogoMark } from './Logo'
import { KATALOG_AKSI, ambilAksi, SLOT_PER_HALAMAN } from '../lib/aksiFab'
import { PemilihAksiFab } from './PemilihAksiFab'
import { toggleTheme } from '../lib/theme'

// ─────────────────────────────────────────────────────────────────────────────
// Navigasi berbentuk satu tombol melayang yang dapat dipindah.
//
// Menggantikan bilah bawah selebar layar. Bilah itu memakan 68 px tinggi layar
// SETIAP SAAT, di aplikasi yang halaman-halamannya sudah setinggi enam layar;
// satu tombol berdiameter 56 px mengembalikan ruang itu ke isi, dan itulah yang
// membuat halaman terasa lebih lapang.
//
// TIGA MASALAH YANG HARUS DISELESAIKAN BERSAMAAN, dan urutannya penting:
//
//   1. GESER vs KETUK. Tombol yang dapat dipindah selalu berisiko kehilangan
//      fungsi ketuknya. Diselesaikan dengan AMBANG 8 px: gerakan di bawah itu
//      tetap dihitung sebagai ketukan. Tanpa ambang, jari yang bergeser satu
//      piksel saat menekan akan membuat menu tidak pernah terbuka.
//
//   2. GESER vs SAPU-KEMBALI DARI TEPI. Ponsel memakai sapuan dari tepi layar
//      untuk kembali ke halaman sebelumnya. Diselesaikan dengan MENJAGA JARAK
//      12 px dari tepi: sapuan sistem berawal pada beberapa piksel pertama, dan
//      pada jarak itu jari yang memulai dari tepi tidak pernah mendarat di atas
//      tombol. Menempelkan tombol rata tepi akan mematikan gerakan kembali —
//      cacat yang tidak akan pernah dilaporkan orang, mereka hanya berhenti
//      memakai gerakan itu.
//
//   3. GESER vs GULIR HALAMAN. Diselesaikan dengan setPointerCapture dan
//      touch-action: none PADA TOMBOLNYA SAJA. Memasangnya pada pembungkus
//      yang lebih besar akan mematikan guliran di daerah yang tampak kosong.
//
// Letaknya disimpan supaya tidak kembali ke sudut asal setiap kali halaman
// dibuka — tombol yang melompat kembali ke tempat semula membuat orang berhenti
// memindahkannya sama sekali.
// ─────────────────────────────────────────────────────────────────────────────

const KUNCI = 'pmd_fab_posisi_v1'
const UKURAN = 56
/** Jarak minimum dari tepi layar. Lihat alasan nomor 2 di atas. */
const TEPI = 12
/** Gerakan di bawah ini masih dihitung ketukan, bukan geseran. */
const AMBANG = 8

type Posisi = { x: number; y: number }

function bacaPosisi(): Posisi | null {
  try {
    const j = localStorage.getItem(KUNCI)
    if (!j) return null
    const p = JSON.parse(j)
    // Bentuknya diperiksa, bukan dipercaya. Data tersimpan bisa berasal dari
    // versi lama maupun rusak, dan posisi NaN membuat tombolnya hilang dari
    // layar tanpa cara mengembalikannya.
    return typeof p?.x === 'number' && typeof p?.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y)
      ? p : null
  } catch { return null }
}

function jepit(p: Posisi): Posisi {
  const lw = window.innerWidth, lt = window.innerHeight
  return {
    x: Math.min(Math.max(p.x, TEPI), Math.max(TEPI, lw - UKURAN - TEPI)),
    y: Math.min(Math.max(p.y, TEPI + 56), Math.max(TEPI, lt - UKURAN - TEPI - 8)),
  }
}

export interface TujuanFab {
  to: string
  label: string
  ikon: React.ReactNode
  end?: boolean
}

/*
 * `tujuan` dan `onTambah` TIDAK LAGI DIPAKAI oleh menu ini, dan itu disengaja.
 *
 * Menu lingkar berisi TINDAKAN, bukan daftar halaman: menaruh enam pintu di
 * sini akan mengulang kisi fitur dan pencarian yang sudah ada, dan tepat itulah
 * yang membuat menu lama terasa seperti menu belaka. Kedua prop dibiarkan ada
 * supaya pemanggilnya tidak perlu diubah sekaligus, dan supaya menu daftar
 * dapat dihidupkan kembali bila ternyata dibutuhkan.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FabNavigasi({ tujuan, onTambah, onCari }: { tujuan: TujuanFab[]; onTambah?: () => void; onCari?: () => void }) {
  const lokasi = useLocation()
  const navigasi = useNavigate()
  // Letak bawaan: sudut kanan bawah, bukan melayang 96 px di atasnya.
  //
  // Tombol yang beristirahat di tengah tinggi layar menutupi isi yang sedang
  // dibaca — terlihat pada tangkapan layar 390x844: ia duduk tepat di atas
  // salah satu ubin lambang, sehingga satu pintu fitur harus digeser dahulu
  // sebelum dapat disentuh. Di sudut, yang tertutupi hanyalah ujung halaman,
  // dan ujung halaman sudah diberi bantalan tersendiri di bawah.
  const [pos, setPos] = useState<Posisi>(() =>
    jepit(bacaPosisi() ?? { x: window.innerWidth - UKURAN - TEPI, y: window.innerHeight - UKURAN - TEPI - 8 }))
  const [buka, setBuka] = useState(false)
  const [menggeser, setMenggeser] = useState(false)
  const [aturBuka, setAturBuka] = useState(false)
  const [pilihan, setPilihan] = useState<string[]>(ambilAksi)
  /* SAMAR SAAT DIAM, JELAS SAAT DISENTUH — persis seperti tombol bantu ponsel.
     Tombol yang selalu pekat menutupi isi bacaan di sudut layar sepanjang
     waktu. Ia tidak pernah dibuat HILANG: tombol yang benar-benar tidak
     terlihat adalah tombol yang tidak dapat ditemukan lagi oleh orang yang
     baru memasangnya. Yang dipilih adalah samar — cukup untuk tidak
     mengganggu, cukup untuk masih terlihat. */
  const [redup, setRedup] = useState(false)
  const jamRedup = useRef<number | null>(null)
  const bangunkan = useCallback(() => {
    setRedup(false)
    if (jamRedup.current) window.clearTimeout(jamRedup.current)
    jamRedup.current = window.setTimeout(() => setRedup(true), 2600)
  }, [])
  useEffect(() => {
    bangunkan()
    return () => { if (jamRedup.current) window.clearTimeout(jamRedup.current) }
  }, [bangunkan])
  /* Halaman ke berapa dari menu yang sedang tampak. */
  const [halaman, setHalaman] = useState(0)
  const geser = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const on = () => setPilihan(ambilAksi())
    window.addEventListener('panacea:aksi-fab', on)
    return () => window.removeEventListener('panacea:aksi-fab', on)
  }, [])

  const ref = useRef<HTMLButtonElement>(null)
  const awal = useRef<{ px: number; py: number; x: number; y: number; geser: boolean } | null>(null)

  // Menu ditutup setiap kali berpindah halaman. Tanpa ini menu tetap terbuka
  // menutupi halaman baru, dan orang mengira halamannya yang tidak berganti.
  useEffect(() => { setBuka(false) }, [lokasi.pathname])

  // Menu yang terbuka tidak boleh meredup, dan menu yang ditutup memulai
  // hitungan meredup dari awal.
  useEffect(() => { if (buka) { setRedup(false); setHalaman(0) } else bangunkan() }, [buka, bangunkan])

  // Layar bisa berputar maupun berubah ukuran; posisi yang tersimpan untuk
  // layar tegak akan berada di luar layar saat mendatar.
  useEffect(() => {
    const ubah = () => setPos((p) => jepit(p))
    window.addEventListener('resize', ubah)
    window.addEventListener('orientationchange', ubah)
    return () => {
      window.removeEventListener('resize', ubah)
      window.removeEventListener('orientationchange', ubah)
    }
  }, [])

  // Tombol Escape menutup menu — jalan keluar yang selalu tersedia bagi
  // pemakai papan tik.
  useEffect(() => {
    if (!buka) return
    const tekan = (e: KeyboardEvent) => { if (e.key === 'Escape') setBuka(false) }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [buka])

  const turun = useCallback((e: React.PointerEvent) => {
    bangunkan()
    awal.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, geser: false }
    ref.current?.setPointerCapture(e.pointerId)
  }, [pos, bangunkan])

  const gerak = useCallback((e: React.PointerEvent) => {
    const a = awal.current
    if (!a) return
    const dx = e.clientX - a.px, dy = e.clientY - a.py
    if (!a.geser && Math.hypot(dx, dy) < AMBANG) return
    if (!a.geser) { a.geser = true; setMenggeser(true); setBuka(false) }
    setPos(jepit({ x: a.x + dx, y: a.y + dy }))
  }, [])

  const naik = useCallback((e: React.PointerEvent) => {
    const a = awal.current
    awal.current = null
    ref.current?.releasePointerCapture?.(e.pointerId)
    if (!a) return
    if (a.geser) {
      setMenggeser(false)
      setPos((p) => {
        // MENEMPEL KE TEPI TERDEKAT, seperti tombol bantu pada ponsel.
        //
        // Tombol yang berhenti di tengah layar menutupi isi bacaan dan tidak
        // pernah berada di tempat yang sama dua kali, sehingga tangan tidak
        // pernah hafal letaknya. Menempel ke tepi membuat letaknya hanya empat
        // kemungkinan, dan tangan menghafalnya dalam beberapa kali pakai.
        const l = jepit(p)
        const kanan = window.innerWidth - UKURAN - TEPI
        const x = l.x + UKURAN / 2 < window.innerWidth / 2 ? TEPI : kanan
        const akhir = jepit({ x, y: l.y })
        try { localStorage.setItem(KUNCI, JSON.stringify(akhir)) } catch {}
        return akhir
      })
      return
    }
    // Gerakan tidak melewati ambang: ini ketukan.
    setBuka((x) => !x)
  }, [])

  // Menu dibuka ke ATAS bila tombol berada di paruh bawah layar, dan ke BAWAH
  // bila di paruh atas — supaya daftarnya tidak pernah keluar layar.
  const keAtas = pos.y > window.innerHeight / 2
  // Rata kanan bila tombol di paruh kanan, supaya daftar tidak melewati tepi.
  const keKiri = pos.x > window.innerWidth / 2

  /* Letak tiap tindakan di dalam kisi 3x3: atas, kiri, kanan, bawah, lalu
     keempat sudut. Tengahnya sengaja DIBIARKAN KOSONG — di situlah ibu jari
     mendarat sesudah mengetuk tombolnya, dan menaruh tindakan di sana membuat
     orang menekan sesuatu yang tidak dimaksudnya.

     Delapan tempat per halaman, bukan enam: dua tempat yang dahulu dikosongkan
     tidak menghemat apa pun — kisinya toh sudah selebar itu — sementara dua
     tindakan lagi harus dibuang karenanya. */
  const TATA = [
    'col-start-2 row-start-1',
    'col-start-1 row-start-2',
    'col-start-3 row-start-2',
    'col-start-2 row-start-3',
    'col-start-1 row-start-3',
    'col-start-3 row-start-3',
    'col-start-1 row-start-1',
    'col-start-3 row-start-1',
  ]

  const jalankan = (id: string) => {
    const a = KATALOG_AKSI.find((x) => x.id === id)
    if (!a) return
    if (a.jenis === 'rute' && a.ke) navigasi(a.ke)
    else if (a.jenis === 'kembali') navigasi(-1)
    else if (a.jenis === 'atas') window.scrollTo({ top: 0, behavior: 'smooth' })
    else if (a.jenis === 'tema') toggleTheme()
  }

  const terpilih = pilihan
    .map((id) => KATALOG_AKSI.find((a) => a.id === id))
    .filter((a): a is (typeof KATALOG_AKSI)[number] => !!a)

  const aksi: { label: string; ikon: React.ReactNode; jalan: () => void; utama?: boolean }[] = [
    ...terpilih.map((a, i) => ({
      label: a.label,
      ikon: <span className="text-[16px] leading-none">{a.ikon}</span>,
      jalan: () => jalankan(a.id),
      utama: i === 0,
    })),
    {
      label: 'Ubah',
      ikon: <span className="text-[15px] leading-none">⚙</span>,
      jalan: () => setAturBuka(true),
    },
  ]

  /* DIPOTONG MENJADI HALAMAN, BUKAN DIPADATKAN.
     Enam belas tindakan pada satu kisi menuntut ikon sebesar 34 px, dan sasaran
     sentuh sekecil itu meleset di tangan yang sedang berjalan. Halaman kedua
     digeser mendatar seperti layar utama ponsel: ukuran tiap tombol tetap. */
  const halamanAksi: typeof aksi[] = []
  for (let i = 0; i < aksi.length; i += SLOT_PER_HALAMAN) {
    halamanAksi.push(aksi.slice(i, i + SLOT_PER_HALAMAN))
  }

  return (
    <>
      {aturBuka && <PemilihAksiFab tutup={() => setAturBuka(false)} />}

      {/* Tirai: menutup menu bila disentuh di luar. Diberi warna sangat samar
          alih-alih sepenuhnya bening supaya jelas bahwa layar sedang "terkunci"
          oleh menu. */}
      {buka && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onPointerDown={() => setBuka(false)}
          aria-hidden="true"
        />
      )}

      <div
        className="fixed z-50 lg:hidden"
        style={{ left: pos.x, top: pos.y }}
        // Tanpa transisi saat sedang digeser: transisi membuat tombol
        // tertinggal di belakang jari, dan tertinggalnya terbaca sebagai
        // aplikasi yang lambat, bukan sebagai gerak yang halus.
      >
        {buka && (
          /* MENU LINGKAR, BUKAN DAFTAR TEGAK.
             Daftar tegak sepanjang enam butir menutupi separuh layar dan
             menuntut mata membaca dari atas ke bawah untuk menemukan satu
             tindakan. Susunan melingkar meletakkan tiap tindakan pada ARAH
             yang tetap — atas, kanan, bawah, kiri — sehingga sesudah beberapa
             kali pakai tangan bergerak tanpa membaca. Itulah alasan tombol
             bantu di ponsel memakai bentuk ini.

             Ukuran 208 px dipilih supaya seluruh menu tetap muat pada layar
             320 px sekalipun tombolnya berada rapat di tepi. */
          <div
            role="menu"
            aria-label="Tindakan cepat"
            /* TEMBUS PANDANG DENGAN BURAM TEBAL, bukan panel pekat.
               Panel pekat memotong halaman menjadi dua benda yang tidak
               berhubungan. Keterbacaannya dijaga oleh buram dan penjenuhan
               warna — cara yang sama dipakai tombol bantu ponsel — bukan
               dengan menutup halaman di belakangnya. */
            className="kaca absolute rounded-[28px] bg-white/62 p-2 shadow-xl backdrop-blur-2xl backdrop-saturate-150 dark:bg-neutral-900/58"
            style={{
              width: 208,
              [keAtas ? 'bottom' : 'top']: 64,
              [keKiri ? 'right' : 'left']: 0,
            } as React.CSSProperties}
          >
            <div
              ref={geser}
              className="geser-aman flex snap-x snap-mandatory overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
              onScroll={(e) => {
                const el = e.currentTarget
                setHalaman(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
              }}
            >
              {halamanAksi.map((hal, h) => (
                <div
                  key={h}
                  className="grid w-full shrink-0 snap-center grid-cols-3 grid-rows-3 place-items-center"
                  style={{ height: 192 }}
                >
                  {hal.map((t, i) => (
                    <button
                      key={t.label}
                      role="menuitem"
                      onClick={() => { setBuka(false); t.jalan() }}
                      className={`flex h-[58px] w-[58px] flex-col items-center justify-center gap-1 rounded-2xl px-1 transition active:scale-95 ${TATA[i]} ${
                        t.utama ? 'bg-brand text-white' : 'text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                      }`}
                    >
                      <span className="shrink-0">{t.ikon}</span>
                      <span className="w-full truncate text-center text-[9.5px] font-bold leading-none">{t.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Titik halaman hanya ditarik bila memang ada halaman kedua.
                Satu titik tunggal tidak memberi tahu apa pun dan hanya
                menyisakan garis di bawah menu. */}
            {halamanAksi.length > 1 && (
              <div className="mt-1 flex items-center justify-center gap-1.5">
                {halamanAksi.map((_, h) => (
                  <button
                    key={h}
                    aria-label={`Halaman ${h + 1} dari ${halamanAksi.length}`}
                    aria-current={h === halaman}
                    onClick={() => geser.current?.scrollTo({ left: h * (geser.current?.clientWidth ?? 0), behavior: 'smooth' })}
                    className={`h-1.5 rounded-full transition-all ${h === halaman ? 'w-4 bg-brand' : 'w-1.5 bg-neutral-400/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <button
          ref={ref}
          onPointerDown={turun}
          onPointerMove={gerak}
          onPointerUp={naik}
          onPointerCancel={naik}
          aria-label={buka ? 'Tutup menu' : 'Buka menu navigasi'}
          aria-expanded={buka}
          // touch-action pada TOMBOLNYA SAJA. Dipasang pada pembungkus yang
          // lebih besar, guliran halaman akan mati di daerah yang tampak kosong.
          className="kaca kaca-tekan grid place-items-center rounded-full"
          style={{
            width: UKURAN,
            height: UKURAN,
            touchAction: 'none',
            cursor: menggeser ? 'grabbing' : 'grab',
            transition: menggeser ? 'none' : 'transform 0.2s cubic-bezier(0.32,0.72,0,1), opacity 0.45s ease',
            transform: buka ? 'rotate(45deg)' : 'none',
            // Samar hanya saat benar-benar diam. Nilainya tidak diturunkan di
            // bawah 0,4: di bawah itu tombolnya tidak lagi lolos ambang beda
            // terang WCAG terhadap latar terang, dan orang yang penglihatannya
            // kurang kehilangan satu-satunya alat navigasi di halaman ini.
            opacity: redup && !buka && !menggeser ? 0.42 : 1,
          }}
        >
          <span style={{ transform: buka ? 'rotate(-45deg)' : 'none' }}>
            <LogoMark size={30} />
          </span>
        </button>
      </div>
    </>
  )
}

export default FabNavigasi
