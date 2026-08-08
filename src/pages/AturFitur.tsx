import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, inputClass } from '../components/ui'
import { IconSettings } from '../components/icons'
import { NAV_UNTUK_PENGATURAN } from '../components/Shell'
import {
  ambilTersembunyi, alihkanFitur, simpanTersembunyi, tampilkanSemua,
  bolehDisembunyikan, langgananFitur,
} from '../lib/fiturTersembunyi'
import { useStore } from '../lib/store'

// ─────────────────────────────────────────────────────────────────────────────
// Atur Fitur — pilih apa yang muncul di menu.
//
// Daftarnya diambil dari definisi navigasi yang sama yang dipakai Shell, jadi
// fitur baru otomatis muncul di sini tanpa perlu didaftarkan dua kali. Daftar
// yang ditulis ulang secara manual pasti akan tertinggal dari yang sebenarnya.
// ─────────────────────────────────────────────────────────────────────────────

export function AturFitur() {
  const { account } = useStore()
  const [tersembunyi, setTersembunyi] = useState<string[]>(ambilTersembunyi)
  const [cari, setCari] = useState('')

  useEffect(() => langgananFitur(setTersembunyi), [])

  const peran = account?.role ?? 'pasien'

  // Hanya fitur yang memang tersedia untuk peran ini; menampilkan menu dokter
  // kepada pasien hanya akan membingungkan.
  const tersedia = useMemo(
    () => NAV_UNTUK_PENGATURAN.filter((n) => n.roles.includes(peran)),
    [peran],
  )

  const perGrup = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const peta = new Map<string, typeof tersedia>()
    for (const n of tersedia) {
      if (q && !`${n.label} ${n.group} ${n.to}`.toLowerCase().includes(q)) continue
      const arr = peta.get(n.group) ?? []
      arr.push(n)
      peta.set(n.group, arr)
    }
    return [...peta.entries()]
  }, [tersedia, cari])

  const jumlahTersembunyi = tersembunyi.length

  return (
    <div className="space-y-4 pb-24">
      <SectionTitle icon={<IconSettings />} title="Atur Fitur"
        subtitle="Hide what you do not use so the menu stays short" />

      <Card>
        <p className="text-sm leading-relaxed text-neutral-600">
          Menyembunyikan fitur <b>tidak menghapusnya</b>. Halamannya tetap hidup, tautan lama dan
          penanda halaman tetap bekerja — yang hilang hanya kehadirannya di menu dan di hub.
          Semuanya bisa dikembalikan kapan pun dari halaman ini.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/5 px-3 py-1 text-[12px] font-bold text-neutral-600">
            {jumlahTersembunyi} disembunyikan
          </span>
          {jumlahTersembunyi > 0 && (
            <button onClick={() => { tampilkanSemua(); setTersembunyi([]) }}
              className="rounded-full bg-brand px-3 py-1 text-[12px] font-bold text-ink">
              Tampilkan semua lagi
            </button>
          )}
        </div>
      </Card>

      <Card>
        <input className={inputClass} placeholder="Cari fitur…" value={cari}
          onChange={(e) => setCari(e.target.value)} />
      </Card>

      {perGrup.length === 0 && (
        <Card><p className="text-sm text-neutral-500">Tidak ada fitur yang cocok dengan "{cari}".</p></Card>
      )}

      {perGrup.map(([grup, items]) => {
        const bisa = items.filter((i) => bolehDisembunyikan(i.to))
        const semuaTersembunyi = bisa.length > 0 && bisa.every((i) => tersembunyi.includes(i.to))
        return (
          <Card key={grup}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-black uppercase tracking-wide text-neutral-500">{grup}</div>
              {bisa.length > 1 && (
                <button
                  onClick={() => {
                    const rute = bisa.map((i) => i.to)
                    const next = semuaTersembunyi
                      ? tersembunyi.filter((x) => !rute.includes(x))
                      : [...new Set([...tersembunyi, ...rute])]
                    simpanTersembunyi(next)
                    setTersembunyi(next)
                  }}
                  className="shrink-0 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-bold text-neutral-600">
                  {semuaTersembunyi ? 'Tampilkan grup' : 'Sembunyikan grup'}
                </button>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {items.map((n) => {
                const kunci = !bolehDisembunyikan(n.to)
                const off = tersembunyi.includes(n.to)
                return (
                  <div key={n.to + n.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${off ? 'bg-white/[0.02]' : 'bg-white/5'}`}>
                    <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${off ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {n.label}
                    </span>
                    {kunci ? (
                      <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-500"
                        title="Always available for safety, and so settings can never lock you out">
                        selalu ada
                      </span>
                    ) : (
                      <button onClick={() => setTersembunyi(alihkanFitur(n.to))}
                        aria-label={off ? `Tampilkan ${n.label}` : `Sembunyikan ${n.label}`}
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold ${off ? 'bg-brand text-white' : 'bg-white/10 text-neutral-600'}`}>
                        {off ? 'Tampilkan' : 'Sembunyikan'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      <Card>
        <p className="text-[12px] leading-relaxed text-neutral-500">
          Beranda, Profil, Pengaturan dan Kartu Darurat sengaja tidak bisa disembunyikan.
          Menyembunyikan jalan menuju pengaturan akan mengunci Anda dari pengaturan Anda sendiri,
          dan tombol darurat bukan sesuatu yang pantas dihilangkan oleh aplikasi kesehatan.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
          Ingin mengatur kartu di beranda? Itu terpisah dan ada di{' '}
          <Link to="/" className="font-semibold text-ink underline">Beranda</Link> lewat tombol
          "Atur kartu beranda".
        </p>
      </Card>
    </div>
  )
}

export default AturFitur
