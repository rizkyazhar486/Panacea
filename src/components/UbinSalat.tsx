import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SALAT, berikutnya, jadwalHariIni, menitSekarang, muatSetelan,
  type JadwalHari, type WaktuSalat,
} from '../lib/adzan'
import { batalkanCatatan, catatSelesai, jumlahHariIni, sudahDicatat, tanggalLokal } from '../lib/prayerLog'
import { HoldToConfirm } from './HoldToConfirm'
import '../styles/widget-concepts-v6.css'
import '../styles/widget-archetypes-v6.css'
import '../styles/widget-concepts-v7.css'
import '../styles/widget-concepts-v9.css'
import '../styles/prayer-widget-dark-hotfix.css'

/** Salat terakhir yang waktunya sudah lewat hari ini — bukan yang berikutnya. Menahan tombol untuk salat yang belum tiba waktunya tidak berarti apa-apa. */
function sudahLewat(j: JadwalHari, menit: number): WaktuSalat | null {
  let lewat: WaktuSalat | null = null
  for (const w of j.waktu) if (w.menit <= menit) lewat = w
  return lewat
}

export function UbinSalat() {
  const setelan = useMemo(() => muatSetelan(), [])
  const [jadwal, setJadwal] = useState<JadwalHari | null>(null)
  const [gagal, setGagal] = useState(false)
  const [kini, setKini] = useState(() => menitSekarang())
  const [, tandai] = useState(0)

  useEffect(() => {
    let hidup = true
    jadwalHariIni(setelan.kota, setelan.negara, setelan.metode)
      .then((j) => { if (hidup) setJadwal(j) })
      .catch(() => { if (hidup) setGagal(true) })
    return () => { hidup = false }
  }, [setelan.kota, setelan.negara, setelan.metode])

  useEffect(() => {
    const t = setInterval(() => setKini(menitSekarang()), 30_000)
    return () => clearInterval(t)
  }, [])

  if (gagal) {
    return (
      <Link to="/prayer-times" className="kaca col-span-2 flex flex-col gap-1 rounded-3xl p-3">
        <span className="t-mikro font-black uppercase tracking-wide text-neutral-500">Prayer rhythm</span>
        <span className="t-kecil text-neutral-500">Prayer times could not be loaded — tap to check.</span>
      </Link>
    )
  }
  if (!jadwal) return null

  const { salat, menitLagi } = berikutnya(jadwal, kini)
  const nama = SALAT.find((s) => s.id === salat.salat)?.nama ?? salat.salat
  const jam = Math.floor(menitLagi / 60)
  const menit = menitLagi % 60
  const countdown = jam > 0 ? `${jam} h ${menit} m` : `${menit} min`

  return (
    <Link to="/prayer-times" className="pw-concept pw-prayer block transition active:scale-[0.99]">
      <div className="flex items-center justify-between gap-2">
        <span className="t-mikro font-black uppercase tracking-[.13em] text-neutral-500">{jadwal.kota}</span>
        <span className="t-mikro truncate text-neutral-400">{jadwal.metode}</span>
      </div>

      <div className="pw-prayer-hero">
        <div className="min-w-0">
          <div className="t-mikro mb-2 font-black uppercase tracking-[.16em] text-brand">Next prayer</div>
          <div className="pw-prayer-name text-ink dark:text-white">{nama}</div>
        </div>
        <div className="pw-prayer-time">
          <div className="pw-prayer-clock text-ink dark:text-white">{salat.jam}</div>
          <div className="pw-prayer-countdown">in {countdown}</div>
        </div>
      </div>

      <div className="pw-prayer-orbit" aria-label="Today's prayer rhythm">
        {jadwal.waktu.map((w) => {
          const ini = w.salat === salat.salat
          return (
            <span key={w.salat} className="pw-prayer-stop" data-active={ini ? 'true' : 'false'}>
              <span className="pw-prayer-dot" aria-hidden />
              <span className="pw-prayer-label">{SALAT.find((s) => s.id === w.salat)?.nama ?? w.salat}</span>
              <span className="pw-prayer-hour">{w.jam}</span>
            </span>
          )
        })}
      </div>

      {/* Menandai salat yang sudah lewat — bukan yang berikutnya, sebab
          menahan tombol untuk salat yang belum tiba waktunya tidak berarti
          apa-apa. `preventDefault` DI SINI, BUKAN HANYA `stopPropagation`:
          kartu ini sendiri adalah tautan ke /prayer-times, dan navigasi
          bawaan sebuah tautan ditentukan oleh `defaultPrevented`, bukan oleh
          sampai-tidaknya kejadian itu ke elemen tautannya. `stopPropagation`
          sendirian justru MENCEGAH <Link> sempat memanggil preventDefault
          miliknya — diuji langsung dengan tekan-tahan sungguhan: tanpa
          preventDefault di sini, peramban tetap pindah halaman begitu
          jarinya dilepas, walau progres sudah penuh dan tercatat. */}
      {(() => {
        const terlewat = sudahLewat(jadwal, kini)
        if (!terlewat) return null
        const tgl = tanggalLokal()
        const namaLewat = SALAT.find((s) => s.id === terlewat.salat)?.nama ?? terlewat.salat
        const selesai = sudahDicatat(tgl, terlewat.salat)
        return (
          <div
            className="pw-prayer-confirm"
            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          >
            <HoldToConfirm
              label={`Mark ${namaLewat} as prayed`}
              doneLabel={`${namaLewat} prayed`}
              done={selesai}
              onConfirm={() => { catatSelesai(tgl, terlewat.salat); tandai((n) => n + 1) }}
              onUndo={() => { batalkanCatatan(tgl, terlewat.salat); tandai((n) => n + 1) }}
            />
            <span className="t-mikro shrink-0 tabular-nums text-neutral-400">{jumlahHariIni(tgl)}/{SALAT.length} today</span>
          </div>
        )
      })()}
    </Link>
  )
}

export default UbinSalat
