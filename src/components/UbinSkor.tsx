import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!backendEnabled) return
    let hidup = true
    let jam: number | undefined

    async function muat() {
      try {
        const favorit = await api.getSportsFavorites()
        if (!hidup) return
        setAdaFavorit(favorit.length > 0)
        if (!favorit.length) { setLaga([]); return }

        // Dikelompokkan per liga supaya satu liga cukup satu permintaan,
        // dan dibatasi tiga liga: widget seukuran ini hanya memuat dua laga,
        // jadi menarik sepuluh liga hanya membuang kuota orang.
        const perLiga = new Map<string, Set<string>>()
        for (const f of favorit) {
          const [liga, ...sisa] = f.split(':')
          const nama = sisa.join(':')
          if (!liga || !nama) continue
          const a = perLiga.get(liga)
          if (a) a.add(nama)
          else perLiga.set(liga, new Set([nama]))
        }

        /* PENCOCOKAN NAMA DILONGGARKAN.
           Favorit disimpan sebagai "liga:nama tim" persis seperti yang
           tertulis di papan skor saat ditekan bintang. Nama itu bisa berubah
           ejaannya di sumbernya ("Tottenham Hotspur" vs "Tottenham"), dan
           pembandingan huruf-per-huruf membuat tim yang jelas-jelas dibintangi
           tidak pernah cocok — persis keluhan yang membuat bagian ini ditulis
           ulang. Sekarang cocok bila salah satu nama memuat yang lain, atau
           singkatannya sama. */
        const cocok = (t: Set<string>, r?: Regu) => {
          if (!r) return false
          const nama = (r.name ?? '').toLowerCase()
          const singkat = (r.abbrev ?? '').toLowerCase()
          for (const f of t) {
            const p = f.toLowerCase()
            if (!p) continue
            if (nama === p || singkat === p) return true
            if (nama.includes(p) || p.includes(nama)) return true
          }
          return false
        }

        const ambil = async (liga: string, tim: Set<string>, dates?: string) => {
          const keluar: Laga[] = []
          try {
            const r = await api.getSportsScores(liga, dates)
            for (const e of (r.events ?? []) as Laga[]) {
              if (cocok(tim, e.home) || cocok(tim, e.away)) keluar.push(e)
            }
          } catch { /* satu liga gagal tidak boleh menjatuhkan yang lain */ }
          return keluar
        }

        const liga3 = [...perLiga.entries()].slice(0, 3)
        let hasil: Laga[] = []
        for (const [liga, tim] of liga3) hasil.push(...await ambil(liga, tim))

        /* TIDAK ADA LAGA HARI INI BUKAN BERARTI TIDAK ADA APA-APA.
           Papan skor tanpa rentang tanggal hanya berisi pertandingan hari ini,
           sehingga widget ini kosong pada hari tim itu libur — dan yang
           terbaca oleh pemakainya adalah "fitur ini rusak", bukan "tim saya
           tidak main hari ini". Bila kosong, ditanyakan sekali lagi untuk
           empat belas hari ke depan dan yang ditampilkan jadwal berikutnya. */
        if (!hasil.length) {
          const hariIni = new Date()
          const cap = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
          const rentang = `${cap(hariIni)}-${cap(new Date(Date.now() + 14 * 864e5))}`
          for (const [liga, tim] of liga3) hasil.push(...await ambil(liga, tim, rentang))
          hasil = hasil.filter((e) => e.state !== 'post')
        }
        if (!hidup) return

        // Yang sedang berjalan paling atas, lalu yang akan main, lalu yang
        // sudah selesai — urutan itu mengikuti seberapa mendesak orang ingin
        // melihatnya, bukan urutan abjad.
        const urutan = { in: 0, pre: 1, post: 2 }
        hasil.sort((a, b) => urutan[a.state] - urutan[b.state] || Date.parse(a.startTime) - Date.parse(b.startTime))
        setLaga(hasil.slice(0, 2))
        setGalat('')

        if (hasil.some((e) => e.state === 'in')) jam = window.setTimeout(muat, 60_000)
      } catch {
        if (hidup) { setGalat('Tidak dapat menghubungi server skor.'); setLaga([]) }
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
        <Link to="/sports-scores" className="t-kecil flex min-h-[40px] items-center font-bold text-brand">
          Semua →
        </Link>
      </div>

      <div className="kaca rounded-3xl p-3">
        {galat ? (
          <p className="t-kecil text-neutral-500">{galat}</p>
        ) : adaFavorit === false ? (
          <Link to="/sports-scores" className="t-kecil block text-neutral-500">
            Belum ada tim favorit. Pilih tim di halaman Skor Olahraga →
          </Link>
        ) : laga.length === 0 ? (
          <p className="t-kecil text-neutral-500">
            Tidak ada pertandingan tim Anda hari ini maupun dalam 14 hari ke depan menurut sumber skor.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {laga.map((e) => {
              const k = KEADAAN[e.state] ?? KEADAAN.pre
              return (
                <Link key={e.id} to="/sports-scores" className="block">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`t-mikro rounded-full px-2 py-0.5 font-black ${k.kelas}`}>{k.label}</span>
                    <span className="t-mikro truncate tabular-nums text-neutral-400">
                      {e.state === 'pre' && e.startTime
                        ? new Date(e.startTime).toLocaleString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : e.statusDetail}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
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
      </div>
    </section>
  )
}

export default UbinSkor
