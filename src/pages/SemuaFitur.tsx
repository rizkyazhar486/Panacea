import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { NAV_UNTUK_PENGATURAN } from '../components/Shell'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'

/**
 * Direktori seluruh fitur, dapat dicari.
 *
 * Ini pasangan dari pemangkasan menu. Menu kini hanya memuat tujuan harian;
 * halaman ini yang menjamin sisanya tetap dapat ditemukan, sehingga memangkas
 * menu tidak sama dengan menghapus fitur.
 *
 * Sumbernya KATALOG yang sama dengan pencarian global — bukan daftar yang
 * ditulis ulang. Daftar kedua yang ditulis tangan pasti akan tertinggal begitu
 * ada fitur baru, dan yang tertinggal itu menjadi fitur yang tidak pernah
 * ditemukan siapa pun.
 */

/** Nama grup dalam bahasa yang dipakai pemakainya, bukan istilah internal. */
const NAMA_GRUP: Record<string, string> = {
  Home: 'Beranda & Sosial',
  Health: 'Kesehatan Harian',
  Longevity: 'Umur Panjang',
  'Calculators & Labs': 'Kalkulator & Lab',
  Fitness: 'Kebugaran',
  'Clinical & AI': 'Klinis & AI',
  Services: 'Layanan',
  Content: 'Belajar & Materi',
  Manage: 'Pengelolaan',
  Account: 'Akun & Lainnya',
}

/**
 * Toko, farmasi, dan transaksi dipisahkan ke grupnya sendiri.
 *
 * Keduanya bukan bagian dari apa yang dipakai orang untuk belajar atau menjaga
 * kesehatannya — mereka jalur jual-beli, dengan alur, kewajiban, dan risiko
 * yang berbeda. Mencampurnya ke dalam menu kesehatan membuat orang mengira
 * setiap ketukan berujung tagihan.
 */
const TOKO = new Set(['/pharmacy', '/orders', '/marketplace', '/billing', '/pricing', '/consult', '/hospitals'])

export default function SemuaFitur() {
  const { account } = useStore()
  const [q, setQ] = useState('')
  const peran = account?.role ?? 'pasien'

  // Dua sumber digabung menurut `to`, dengan menu didahulukan karena labelnya
  // yang dipakai di navigasi. Tanpa penggabungan ini halaman "Semua Fitur"
  // hanya memuat 59 dari 187 tujuan -- namanya berjanji lebih daripada isinya.
  const semua = useMemo(() => {
    const peta = new Map<string, { to: string; label: string; group: string; kw: string; roles: string[] }>()
    for (const f of FITUR_DARI_HUB) {
      peta.set(f.to, { to: f.to, label: f.nama, group: f.grup, kw: `${f.apa} ${f.kw}`, roles: [] })
    }
    for (const n of NAV_UNTUK_PENGATURAN) {
      const ada = peta.get(n.to)
      peta.set(n.to, { to: n.to, label: n.label, group: n.group, kw: ada?.kw ?? '', roles: n.roles })
    }
    return [...peta.values()]
  }, [])

  const grup = useMemo(() => {
    const kata = q.toLowerCase().trim()
    const cocok = semua.filter((n) => {
      // Tujuan yang datang dari hub tidak membawa daftar peran; hub itu
      // sendiri sudah membatasi siapa yang bisa membukanya, jadi daftar kosong
      // di sini berarti "tidak dibatasi", bukan "tidak boleh siapa pun".
      if (n.roles.length && !n.roles.includes(peran)) return false
      if (n.to === '/semua-fitur') return false
      if (!kata) return true
      // Dicocokkan PER KATA, bukan sebagai frasa utuh. Dengan `includes`,
      // mengetik "pulmonary embolism" tidak menemukan Wells Score meskipun
      // kedua katanya ada di sana -- hanya urutannya yang tidak persis sama.
      // Semua kata harus ada, jadi menambah kata tetap mempersempit hasil.
      const teks = `${n.label} ${n.group} ${n.to} ${n.kw}`.toLowerCase()
      return kata.split(/\s+/).every((w) => teks.includes(w))
    })
    const peta = new Map<string, typeof cocok>()
    for (const n of cocok) {
      const g = TOKO.has(n.to) ? 'Toko & Layanan Berbayar' : (NAMA_GRUP[n.group] ?? n.group)
      if (!peta.has(g)) peta.set(g, [])
      peta.get(g)!.push(n)
    }
    // Toko diletakkan paling belakang: ia yang paling jarang dituju, dan
    // menaruhnya di atas membuat halaman ini terbaca sebagai etalase.
    return [...peta.entries()].sort((a, b) =>
      (a[0].startsWith('Toko') ? 1 : 0) - (b[0].startsWith('Toko') ? 1 : 0))
  }, [q, peran, semua])

  const total = grup.reduce((a, [, v]) => a + v.length, 0)

  return (
    <div className="space-y-4 pb-4">
      <header>
        <h1 className="text-[20px] font-black text-ink dark:text-white">Semua Fitur</h1>
        <p className="text-[13px] text-neutral-500">
          {total} halaman. Menu hanya memuat yang harian — sisanya ada di sini.
        </p>
      </header>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari fitur…"
        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-[13px] outline-none focus:border-brand dark:border-white/10 dark:bg-white/5"
      />

      {grup.map(([nama, isi]) => (
        <section key={nama}>
          <h2 className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-neutral-500">
            {nama} <span className="text-neutral-400">· {isi.length}</span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {isi.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                /* h-10: 40 px adalah batas bawah sasaran sentuh. Dengan py-1.5
                   tinggi setiap keping hanya 30 px, dan pada kisi serapat ini
                   meleset satu keping berarti membuka halaman yang salah. */
                className="inline-flex h-10 items-center rounded-full bg-neutral-100 px-3 text-[12px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-200"
              >
                {n.label}
              </Link>
            ))}
          </div>
        </section>
      ))}

      {total === 0 && (
        <p className="text-center text-[13px] text-neutral-500">Tidak ada yang cocok — coba kata lain.</p>
      )}
    </div>
  )
}
