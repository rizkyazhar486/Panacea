import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { NAV_UNTUK_PENGATURAN } from '../components/Shell'
import { FITUR_DARI_HUB } from '../lib/katalogFitur'
import { penjelasan } from '../lib/penjelasanFitur'

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
    const peta = new Map<string, { to: string; label: string; group: string; kw: string; apa: string; roles: string[] }>()
    for (const f of FITUR_DARI_HUB) {
      peta.set(f.to, { to: f.to, label: f.nama, group: f.grup, kw: `${f.apa} ${f.kw}`, apa: f.apa, roles: [] })
    }
    for (const n of NAV_UNTUK_PENGATURAN) {
      const ada = peta.get(n.to)
      // Label menu didahulukan, namun keterangan dari hub DIPERTAHANKAN.
      // Sebelumnya keterangan itu ikut terhapus setiap kali sebuah tujuan juga
      // ada di menu, sehingga tujuan yang paling sering dipakai justru yang
      // paling sering kehilangan penjelasannya.
      peta.set(n.to, { to: n.to, label: n.label, group: n.group, kw: ada?.kw ?? '', apa: ada?.apa ?? '', roles: n.roles })
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
      // Penjelasan bahasa Indonesia WAJIB ikut dicari. Tanpa ini, kalimat
      // yang ditulis khusus agar orang awam mengerti justru tidak dapat
      // dipakai untuk menemukan fiturnya: mengetik "darurat" tidak menemukan
      // "Emergency Card & SOS" meskipun penjelasannya diawali kata itu.
      const teks = `${n.label} ${n.group} ${n.to} ${n.kw} ${penjelasan(n.to, n.apa)}`.toLowerCase()
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
          {/* Tabel, bukan deretan keping.
              Keping hanya memuat nama, dan nama seperti "VitaPulse" maupun
              "Braden Scale" tidak memberi tahu siapa pun apa isinya — sehingga
              halaman yang namanya berjanji memuat semua fitur justru tidak
              membantu menemukan satu pun. Setiap baris kini membawa
              penjelasannya sendiri.

              Dibangun dengan <ul>, bukan <table>: pada lebar 390 px tabel
              sungguhan memaksa dua kolom berdampingan, dan kolom penjelasan
              tersisa ±150 px sehingga tiap kalimat pecah menjadi enam baris.
              Susunan menurun membuat penjelasan memakai lebar penuh. */}
          <ul className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-white/10">
            {isi.map((n, i) => {
              const apa = penjelasan(n.to, n.apa)
              return (
                <li key={n.to} className={i > 0 ? 'border-t border-neutral-200 dark:border-white/10' : ''}>
                  <Link
                    to={n.to}
                    /* min-h-[56px]: dua baris teks pada 390 px, sekaligus jauh
                       di atas batas bawah sasaran sentuh 40 px. */
                    className="flex min-h-[56px] items-center gap-3 bg-white px-3 py-2.5 transition active:bg-neutral-50 dark:bg-white/5 dark:active:bg-white/10"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold leading-tight text-ink dark:text-white">
                        {n.label}
                      </span>
                      {apa && (
                        <span className="mt-0.5 block text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                          {apa}
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-[13px] font-black text-neutral-300 dark:text-neutral-600">›</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {total === 0 && (
        <p className="text-center text-[13px] text-neutral-500">Tidak ada yang cocok — coba kata lain.</p>
      )}
    </div>
  )
}
