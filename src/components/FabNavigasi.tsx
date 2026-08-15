import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LogoMark } from './Logo'

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

export function FabNavigasi({ tujuan, onTambah }: { tujuan: TujuanFab[]; onTambah?: () => void }) {
  const lokasi = useLocation()
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

  const ref = useRef<HTMLButtonElement>(null)
  const awal = useRef<{ px: number; py: number; x: number; y: number; geser: boolean } | null>(null)

  // Menu ditutup setiap kali berpindah halaman. Tanpa ini menu tetap terbuka
  // menutupi halaman baru, dan orang mengira halamannya yang tidak berganti.
  useEffect(() => { setBuka(false) }, [lokasi.pathname])

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
    awal.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, geser: false }
    ref.current?.setPointerCapture(e.pointerId)
  }, [pos])

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
        const akhir = jepit(p)
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

  return (
    <>
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
          <div
            role="menu"
            aria-label="Navigasi utama"
            className={`absolute flex w-[186px] flex-col gap-1 rounded-3xl p-2 kaca ${
              keAtas ? 'bottom-[64px]' : 'top-[64px]'
            } ${keKiri ? 'right-0' : 'left-0'}`}
          >
            {tujuan.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                role="menuitem"
                onClick={() => setBuka(false)}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-2.5 rounded-2xl px-3 text-[13px] font-bold transition ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-ink hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
                  }`
                }
              >
                <span className="shrink-0">{t.ikon}</span>
                <span className="truncate">{t.label}</span>
              </NavLink>
            ))}

            {onTambah && (
              <button
                role="menuitem"
                onClick={() => { setBuka(false); onTambah() }}
                className="mt-1 flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-brand text-[13px] font-black text-white"
              >
                <span className="text-[17px] leading-none">＋</span> Buat Kiriman
              </button>
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
            transition: menggeser ? 'none' : 'transform 0.2s cubic-bezier(0.32,0.72,0,1)',
            transform: buka ? 'rotate(45deg)' : 'none',
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
