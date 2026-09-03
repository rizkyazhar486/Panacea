import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconSearch } from '../components/icons'
import { cari, siapkanIndeks, NAMA_JENIS, type Hasil, type JenisHasil } from '../lib/mesinCari'
import { alihkanPantauan, ambilPantauan } from '../lib/pantauan'

// ─────────────────────────────────────────────────────────────────────────────
// Satu kotak untuk seluruh isi aplikasi: fitur, penyakit, obat, stasiun OSCE,
// dan kalkulator.
//
// TANPA TOMBOL "CARI". Hasil muncul saat mengetik. Tombol cari menambah satu
// ketukan pada pekerjaan yang paling sering dilakukan orang di halaman ini,
// dan tidak memberi apa pun sebagai gantinya.
//
// HASIL DIKELOMPOKKAN MENURUT JENISNYA. Satu daftar bercampur memaksa pembaca
// memeriksa tiap baris untuk tahu ia sedang melihat penyakit atau nama obat;
// kelompok menjawabnya sebelum dibaca.
// ─────────────────────────────────────────────────────────────────────────────

const URUTAN: JenisHasil[] = ['fitur', 'kalkulator', 'penyakit', 'obat', 'stasiun']

const WARNA: Record<JenisHasil, string> = {
  fitur: 'text-brand',
  kalkulator: 'text-sky-500',
  penyakit: 'text-rose-500',
  obat: 'text-amber-500',
  stasiun: 'text-violet-500',
}

export function CariSemua() {
  const [q, setQ] = useState('')
  const [siap, setSiap] = useState(0)
  // Bintang menandai butir yang dipantau. Disimpan sebagai daftar alamat,
  // bukan indeks baris, supaya tandanya tetap benar ketika hasil pencarian
  // berubah urutan.
  const [pantau, setPantau] = useState<string[]>(() => ambilPantauan().map((p) => p.ke))

  useEffect(() => { siapkanIndeks().then(setSiap).catch(() => setSiap(-1)) }, [])

  const hasil = useMemo<Hasil[]>(() => (siap > 0 ? cari(q) : []), [q, siap])

  const kelompok = useMemo(() => {
    const peta = new Map<JenisHasil, Hasil[]>()
    for (const h of hasil) {
      if (!peta.has(h.jenis)) peta.set(h.jenis, [])
      peta.get(h.jenis)!.push(h)
    }
    return URUTAN.filter((j) => peta.has(j)).map((j) => [j, peta.get(j)!] as const)
  }, [hasil])

  return (
    <div className="mx-auto max-w-3xl space-y-3 px-fluid pb-24">
      <div className="sticky top-0 z-10 -mx-fluid bg-white/85 px-fluid py-3 backdrop-blur dark:bg-neutral-950/85">
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 dark:border-white/15 dark:bg-white/10">
          <IconSearch size={18} className="shrink-0 text-neutral-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search features, diseases, drugs, scores…"
            aria-label="Search the whole app"
            className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-neutral-400 dark:text-white"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear" className="shrink-0 px-1 text-lg leading-none text-neutral-400">×</button>
          )}
        </div>
        <p className="t-mikro mt-1.5 text-neutral-500">
          {siap === -1 ? 'Index failed to load.' : siap === 0 ? 'Preparing index…' : `${siap.toLocaleString('en-GB')} entries indexed`}
          {q.trim().length >= 2 && siap > 0 && ` · ${hasil.length} results`}
        </p>
      </div>

      {q.trim().length < 2 ? (
        <p className="t-kecil px-1 text-neutral-500">Type at least two letters.</p>
      ) : hasil.length === 0 ? (
        <p className="t-kecil px-1 text-neutral-500">Nothing matches "{q.trim()}".</p>
      ) : (
        kelompok.map(([jenis, daftar]) => (
          <section key={jenis}>
            <h2 className="t-kecil mb-1.5 font-black uppercase tracking-wide text-neutral-500">
              {NAMA_JENIS[jenis]} <span className="tabular-nums opacity-60">{daftar.length}</span>
            </h2>
            <div className="kaca divide-y divide-neutral-100 overflow-hidden rounded-2xl dark:divide-white/10">
              {daftar.map((h) => (
                <div key={h.jenis + h.judul + h.ke} className="flex min-h-[52px] items-center gap-2 px-2 py-2">
                  <span className={`t-mikro w-1 shrink-0 self-stretch rounded-full ${WARNA[h.jenis]}`} style={{ background: 'currentColor' }} />
                  <Link to={h.ke} className="min-w-0 flex-1 py-1">
                    <span className="t-kecil block truncate font-bold text-ink dark:text-white">{h.judul}</span>
                    <span className="t-mikro block truncate text-neutral-500">{h.ringkas}</span>
                  </Link>
                  {/* Bintang berdiri SENDIRI, di luar tautan. Menaruhnya di
                      dalam tautan membuat tiap penekanan bintang ikut membuka
                      halamannya — dan tepat itulah yang tidak diinginkan orang
                      yang sedang menyusun daftar pantauannya. */}
                  <button
                    onClick={() => { setPantau(alihkanPantauan({ jenis: h.jenis, judul: h.judul, ke: h.ke }).map((p) => p.ke)) }}
                    aria-pressed={pantau.includes(h.ke)}
                    aria-label={pantau.includes(h.ke) ? `Stop watching ${h.judul}` : `Watch ${h.judul}`}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[16px] leading-none transition ${
                      pantau.includes(h.ke) ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
                    }`}
                  >
                    {pantau.includes(h.ke) ? '★' : '☆'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

export default CariSemua
