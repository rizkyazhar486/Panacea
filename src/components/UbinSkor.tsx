import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, backendEnabled } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Widget skor pertandingan — tim yang DIPILIH SENDIRI, bukan yang ditebak.
//
// Tim favorit sudah tersimpan di server oleh halaman Skor Olahraga dalam
// bentuk "liga:nama tim". Widget ini membacanya, mengambil papan skor liga
// yang bersangkutan, lalu menampilkan pertandingan yang memuat salah satu tim
// itu — pertandingan yang sedang berjalan didahulukan.
//
// TIDAK ADA ANGKA CADANGAN. Bila server tidak dapat dihubungi, atau tidak ada
// pertandingan hari ini, widget ini menyatakannya dan berhenti di situ. Skor
// yang dikarang atau skor basi yang ditampilkan seolah langsung adalah cacat
// terburuk yang mungkin dimiliki papan skor.
//
// MEMBACA ULANG HANYA SELAMA ADA YANG BERJALAN, tiap 60 detik. Menyegarkan
// terus-menerus di luar itu hanya menghabiskan baterai dan kuota untuk angka
// yang sudah selesai berubah.
// ─────────────────────────────────────────────────────────────────────────────

interface Regu { name: string; abbrev: string; logo?: string; score?: string }
interface Laga {
  id: string
  startTime: string
  state: 'pre' | 'in' | 'post'
  statusDetail: string
  home: Regu
  away: Regu
}

const KEADAAN: Record<Laga['state'], { label: string; kelas: string }> = {
  in: { label: 'LANGSUNG', kelas: 'bg-rose-500 text-white' },
  post: { label: 'Selesai', kelas: 'bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300' },
  pre: { label: 'Akan main', kelas: 'bg-brand/15 text-brand-dark dark:text-brand' },
}

/* Liga sepak bola yang timnya juga dapat bermain di Liga Champions. Dipakai
   untuk mencari sekali lagi tim yang liga domestiknya sedang kosong pekan itu. */
const SEPAKBOLA = new Set([
  'epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'eredivisie', 'primeira',
  'belpro', 'superlig', 'scottish', 'championship',
])

function Lambang({ src, nama }: { src?: string; nama: string }) {
  const [rusak, setRusak] = useState(false)
  const inisial = nama.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase()
  if (!src || rusak) {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-[10px] font-black text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
        {inisial}
      </span>
    )
  }
  return <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-full object-contain" onError={() => setRusak(true)} />
}

export function UbinSkor() {
  const [laga, setLaga] = useState<Laga[] | null>(null)
  const [galat, setGalat] = useState('')
  const [adaFavorit, setAdaFavorit] = useState<boolean | null>(null)
  const [kosongTim, setKosongTim] = useState<{ nama: string; sebab: 'gagal' | 'kosong' }[]>([])
  const geser = useRef<HTMLDivElement>(null)
  const [aktif, setAktif] = useState(0)

  useEffect(() => {
    const el = geser.current
    if (!el) return
    let jalan = false
    const pada = () => {
      if (jalan) return
      jalan = true
      requestAnimationFrame(() => {
        setAktif(Math.max(0, Math.round(el.scrollLeft / Math.max(1, el.clientWidth))))
        jalan = false
      })
    }
    el.addEventListener('scroll', pada, { passive: true })
    return () => el.removeEventListener('scroll', pada)
  }, [laga])

  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    let jam: number | undefined

    async function muat() {
      try {
        const favorit = await api.getSportsFavorites()
        if (!hidup) return
        setAdaFavorit(favorit.length > 0)
        if (!favorit.length) { setLaga([]); setKosongTim([]); return }

        // "liga:nama tim" — persis seperti yang tertulis di papan skor saat
        // bintangnya ditekan.
        const tim: { liga: string; nama: string }[] = []
        for (const f of favorit) {
          const [liga, ...sisa] = f.split(':')
          const nama = sisa.join(':')
          if (liga && nama) tim.push({ liga, nama })
        }
        if (!tim.length) { setLaga([]); setKosongTim([]); return }

        /* PENCOCOKAN NAMA DILONGGARKAN.
           Nama bisa berubah ejaannya di sumbernya ("Tottenham Hotspur" vs
           "Tottenham"), dan pembandingan huruf-per-huruf membuat tim yang
           jelas-jelas dibintangi tidak pernah cocok. */
        const cocokSatu = (nama: string, r?: Regu) => {
          if (!r) return false
          const n = (r.name ?? '').toLowerCase()
          const singkat = (r.abbrev ?? '').toLowerCase()
          const p = nama.toLowerCase()
          if (!p) return false
          return n === p || singkat === p || n.includes(p) || p.includes(n)
        }
        const adaDi = (nama: string, e: Laga) => cocokSatu(nama, e.home) || cocokSatu(nama, e.away)

        const cap = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
        const rentang = (hariKeDepan: number) =>
          `${cap(new Date(Date.now() - 864e5))}-${cap(new Date(Date.now() + hariKeDepan * 864e5))}`

        const gagal = new Set<string>()
        const singgah = new Map<string, Laga[]>()
        const ambil = async (liga: string, hariKeDepan: number): Promise<Laga[]> => {
          const kunci = `${liga}@${hariKeDepan}`
          const ada = singgah.get(kunci)
          if (ada) return ada
          try {
            const r = await api.getSportsScores(liga, rentang(hariKeDepan))
            const ev = ((r.events ?? []) as Laga[]).filter((e) => e && e.id)
            singgah.set(kunci, ev)
            return ev
          } catch {
            // Kegagalan satu liga TIDAK BOLEH DIAM. Sebelum ini ia ditelan
            // diam-diam, dan yang terlihat oleh pemakainya adalah tim yang
            // dibintanginya "hilang" tanpa satu pun keterangan — persis
            // keluhan yang membuat bagian ini ditulis ulang lagi.
            gagal.add(liga)
            singgah.set(kunci, [])
            return []
          }
        }

        // Satu permintaan per liga yang dibintangi, empat belas hari ke depan.
        const ligaTim = [...new Set(tim.map((t) => t.liga))].slice(0, 6)
        for (const liga of ligaTim) await ambil(liga, 14)

        const punya = new Map<string, Laga[]>()
        const catat = (kunciTim: string, ev: Laga[]) => {
          if (ev.length) punya.set(kunciTim, [...(punya.get(kunciTim) ?? []), ...ev])
        }
        for (const t of tim) {
          const ev = (singgah.get(`${t.liga}@14`) ?? []).filter((e) => adaDi(t.nama, e))
          catat(`${t.liga}:${t.nama}`, ev)
        }

        /* TIM SEPAK BOLA JUGA MAIN DI PIALA.
           PSG dibintangi pada tab Ligue 1, tetapi pada pekan Liga Champions
           jadwal Ligue 1-nya kosong — dan widget ini lalu tidak menampilkan
           apa pun untuk tim yang jelas sedang bermain. Yang belum kebagian
           laga dicari sekali lagi di Liga Champions, lalu di jendela tiga
           puluh hari liganya sendiri. */
        const belum = tim.filter((t) => !punya.get(`${t.liga}:${t.nama}`)?.length)
        if (belum.some((t) => SEPAKBOLA.has(t.liga))) {
          const ucl = await ambil('ucl', 14)
          for (const t of belum) {
            if (!SEPAKBOLA.has(t.liga)) continue
            catat(`${t.liga}:${t.nama}`, ucl.filter((e) => adaDi(t.nama, e)))
          }
        }
        for (const t of tim.filter((x) => !punya.get(`${x.liga}:${x.nama}`)?.length)) {
          const jauh = await ambil(t.liga, 30)
          catat(`${t.liga}:${t.nama}`, jauh.filter((e) => adaDi(t.nama, e)))
        }
        if (!hidup) return

        // Yang sedang berjalan paling atas, lalu yang akan main, lalu yang
        // sudah selesai — urutan itu mengikuti seberapa mendesak orang ingin
        // melihatnya, bukan urutan abjad.
        const urutan = { in: 0, pre: 1, post: 2 }
        const urut = (a: Laga, b: Laga) =>
          urutan[a.state] - urutan[b.state] || Date.parse(a.startTime) - Date.parse(b.startTime)

        // Giliran pertama satu laga untuk TIAP tim, supaya satu tim yang
        // jadwalnya padat tidak memakan seluruh tempat.
        const terpilih: Laga[] = []
        const sudah = new Set<string>()
        for (const t of tim) {
          const daftar = (punya.get(`${t.liga}:${t.nama}`) ?? []).sort(urut)
          const e = daftar.find((x) => !sudah.has(x.id))
          if (e) { terpilih.push(e); sudah.add(e.id) }
        }
        for (const daftar of punya.values()) {
          for (const e of daftar.sort(urut)) {
            if (terpilih.length >= 10) break
            if (!sudah.has(e.id)) { terpilih.push(e); sudah.add(e.id) }
          }
        }
        terpilih.sort(urut)

        // Tim yang benar-benar tidak punya jadwal TETAP DISEBUT, dengan
        // alasannya. Bintang yang ditekan lalu tidak menghasilkan apa pun di
        // layar terbaca sebagai kerusakan, padahal yang terjadi hanya "tidak
        // ada jadwal" — dan kedua hal itu harus dapat dibedakan.
        setKosongTim(
          tim
            .filter((t) => !punya.get(`${t.liga}:${t.nama}`)?.length)
            .map((t) => ({ nama: t.nama, sebab: gagal.has(t.liga) ? 'gagal' : 'kosong' as 'gagal' | 'kosong' })),
        )
        setLaga(terpilih)
        setGalat(gagal.size && !terpilih.length ? 'Sumber skor sedang tidak dapat dihubungi.' : '')

        if (terpilih.some((e) => e.state === 'in')) jam = window.setTimeout(muat, 60_000)
      } catch {
        if (hidup) { setGalat('Tidak dapat menghubungi server skor.'); setLaga([]); setKosongTim([]) }
      }
    }

    void muat()
    return () => { hidup = false; if (jam) window.clearTimeout(jam) }
  }, [])

  // Tanpa server, papan skor tidak punya sumber sama sekali — widgetnya tidak
  // digambar, bukan digambar kosong.
  if (!backendEnabled) return null
  if (laga === null) return null

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="t-kecil font-black uppercase tracking-wide text-neutral-500">Skor tim Anda</h2>
        <div className="ml-auto flex items-center gap-2">
          {/* Penanda halaman: berapa laga yang ada dan di mana kita sekarang.
              Tanpa ini, satu-satunya cara mengetahui masih ada tim lain di
              sebelah adalah dengan menggesernya lebih dulu. */}
          {laga && laga.length > 1 && (
            <span className="flex items-center gap-1" aria-hidden>
              {laga.slice(0, 10).map((e, i) => (
                <span
                  key={e.id}
                  className={`h-1.5 rounded-full transition-all ${i === aktif ? 'w-4 bg-brand' : 'w-1.5 bg-neutral-300 dark:bg-white/25'}`}
                />
              ))}
            </span>
          )}
          <Link to="/sports-scores" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
            Semua →
          </Link>
        </div>
      </div>

      <div className="kaca rounded-3xl p-3">
        {galat ? (
          <p className="t-kecil text-neutral-500">{galat}</p>
        ) : adaFavorit === false ? (
          <Link to="/sports-scores" className="t-kecil block text-neutral-500">
            Belum ada tim favorit. Pilih tim di halaman Skor Olahraga →
          </Link>
        ) : laga.length === 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="t-kecil text-neutral-500">
              Tidak ada pertandingan tim Anda dalam 30 hari ke depan menurut sumber skor.
            </p>
            {kosongTim.map((t) => (
              <p key={t.nama} className="t-mikro text-neutral-400">
                {t.nama} — {t.sebab === 'gagal' ? 'liganya tidak dapat diambil dari sumber skor saat ini' : 'tidak ada jadwal'}
              </p>
            ))}
          </div>
        ) : (
          <div
            ref={geser}
            className="geser-halaman"
            style={{ scrollbarWidth: 'none' }}
          >
            {laga.map((e) => {
              const k = KEADAAN[e.state] ?? KEADAAN.pre
              return (
                <Link
                  key={e.id}
                  to="/sports-scores"
                  /* Lebar halaman DIPAKU pada lebar petak: flex-basis 100% dengan
                     min-width 0, supaya isi terpanjang (nama tim) tidak
                     melebarkan halamannya sendiri dan membuat geseran berhenti
                     sedikit meleset dari tepi — bergeser beberapa piksel tiap
                     halaman, dan pada halaman kelima meleset satu kartu. */
                  className="block overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`t-mikro rounded-full px-2 py-0.5 font-black ${k.kelas}`}>{k.label}</span>
                    <span className="t-mikro truncate tabular-nums text-neutral-400">
                      {e.state === 'pre' && e.startTime
                        ? new Date(e.startTime).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : e.statusDetail}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Lambang src={e.home.logo} nama={e.home.name} />
                    <span className="t-kecil min-w-0 flex-1 truncate font-bold text-ink dark:text-white">{e.home.abbrev || e.home.name}</span>
                    <span className="shrink-0 text-[20px] font-black leading-none tabular-nums text-ink dark:text-white">
                      {e.state === 'pre' ? '–' : `${e.home.score ?? 0}`}
                      <span className="px-1 text-neutral-400">:</span>
                      {e.state === 'pre' ? '–' : `${e.away.score ?? 0}`}
                    </span>
                    <span className="t-kecil min-w-0 flex-1 truncate text-right font-bold text-ink dark:text-white">{e.away.abbrev || e.away.name}</span>
                    <Lambang src={e.away.logo} nama={e.away.name} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Tim yang dibintangi tetapi tanpa jadwal TETAP DISEBUT namanya.
            Bintang yang ditekan lalu tidak menghasilkan apa pun di layar
            terbaca sebagai kerusakan, padahal yang terjadi hanya "tidak ada
            jadwal" — dan kedua hal itu harus dapat dibedakan tanpa menebak. */}
        {laga.length > 0 && kosongTim.length > 0 && (
          <p className="t-mikro mt-2 border-t border-neutral-200 pt-2 leading-snug text-neutral-400 dark:border-white/10">
            {kosongTim.map((t) => `${t.nama} (${t.sebab === 'gagal' ? 'sumber gagal' : 'tanpa jadwal'})`).join(' · ')}
          </p>
        )}
      </div>
    </section>
  )
}

export default UbinSkor
