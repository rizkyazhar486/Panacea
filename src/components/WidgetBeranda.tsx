import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useJam } from '../lib/useJam'
import { Card } from './ui'
import { Portal } from './Portal'
import { WIDGETS, ambilWidget, alihkanWidget, simpanWidget, widgetBawaan } from '../lib/homeWidgets'
import { getWorkouts } from '../lib/workoutStore'
import { hrMaxFromAge } from '../lib/workoutImport'
import { getDemo } from '../lib/profile'
import { useVitals } from '../lib/useVitals'
import { KolomPelatih } from './KolomPelatih'
import { kemajuanTarget, usahaTerbaik, kebugaranKesegaran, bacaKesegaran, type Target } from '../lib/analisisPro'

// ─────────────────────────────────────────────────────────────────────────────
// Kartu pilihan pengguna di Beranda.
//
// Fitur sudah banyak dan tidak semua orang memakai bagian yang sama, jadi yang
// tampil di Beranda ditentukan penggunanya sendiri — bukan ditebak oleh kami.
//
// Kartu hanya dirender bila datanya benar-benar ada. Kartu kosong berisi
// "belum ada data" hanya menambah panjang halaman tanpa memberi apa pun.
// ─────────────────────────────────────────────────────────────────────────────

export function WidgetBeranda() {
  const vitals = useVitals()
  const demo = useMemo(() => getDemo(), [])
  const [aktif, setAktif] = useState<string[]>(ambilWidget)
  const [buka, setBuka] = useState(false)

  useEffect(() => {
    const on = () => setAktif(ambilWidget())
    window.addEventListener('panacea:home-widgets', on)
    return () => window.removeEventListener('panacea:home-widgets', on)
  }, [])

  const workouts = useMemo(() => getWorkouts(), [vitals])
  // Kelelahan meluruh terhadap jam berjalan; tanpa ini kartu beranda membeku.
  const sekarang = useJam()
  const konteks = useMemo(() => {
    const teramati = workouts.reduce((a, w) => Math.max(a, w.maxHr ?? 0), 0)
    return {
      hrMax: Math.max(teramati, hrMaxFromAge(demo.age || 30, demo.sex)),
      hrRest: demo.restingHr && demo.restingHr > 0 ? demo.restingHr : 60,
      sex: demo.sex,
    }
  }, [workouts, demo])

  const punya = useCallback((id: string) => aktif.includes(id), [aktif])

  const target: Target = useMemo(() => {
    try { const r = localStorage.getItem('pmd-target-latihan'); if (r) return JSON.parse(r) } catch { /* abaikan */ }
    return { jenis: 'jarak', periode: 'pekan', nilai: 20 }
  }, [vitals])

  const kartu: React.ReactNode[] = []

  if (punya('pelatih') && workouts.length > 0) {
    kartu.push(<KolomPelatih key="pelatih" workouts={workouts} konteks={konteks} ringkas />)
  }

  if (punya('targetLatihan') && workouts.length > 0) {
    const k = kemajuanTarget(workouts, target)
    kartu.push(
      <Card key="target">
        <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Target latihan</div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="text-lg font-black text-white">
            {k.tercapai} <span className="text-[12px] font-bold text-slate-400">/ {k.sasaran} {k.satuan}</span>
          </span>
          <span className={`text-[12px] font-bold ${k.diJalur ? 'text-emerald-400' : 'text-amber-400'}`}>{k.pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${k.pct}%`, background: k.diJalur ? '#22c55e' : '#f59e0b' }} />
        </div>
      </Card>,
    )
  }

  if (punya('kebugaran') && workouts.length > 0) {
    const ff = kebugaranKesegaran(workouts, konteks, 90, sekarang)
    const kini = ff.length ? ff[ff.length - 1] : null
    if (kini) {
      const b = bacaKesegaran(kini.kesegaran)
      kartu.push(
        <Card key="kebugaran">
          <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Kebugaran & kesegaran</div>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="flex gap-4">
              <Mini label="Bugar" nilai={Math.round(kini.kebugaran)} warna="#60a5fa" />
              <Mini label="Lelah" nilai={Math.round(kini.kelelahan)} warna="#f87171" />
              <Mini label="Segar" nilai={Math.round(kini.kesegaran)} warna={b.warna} />
            </div>
            <span className="shrink-0 text-[11px] font-bold" style={{ color: b.warna }}>{b.judul}</span>
          </div>
        </Card>,
      )
    }
  }

  if (punya('usahaTerbaik')) {
    const pr = usahaTerbaik(workouts).slice(0, 3)
    if (pr.length) {
      kartu.push(
        <Card key="pr">
          <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Usaha terbaik</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {pr.map((p) => (
              <div key={p.label} className="rounded-xl bg-white/5 px-3 py-1.5">
                <div className="text-[12px] font-black text-white">
                  {Math.floor(p.detik / 60)}:{String(p.detik % 60).padStart(2, '0')}
                </div>
                <div className="text-[9px] text-slate-500">{p.label}</div>
              </div>
            ))}
          </div>
        </Card>,
      )
    }
  }

  // Kartu yang isinya hidup di halamannya sendiri: tampilkan sebagai pintasan.
  const pintasan = WIDGETS.filter(
    (w) => punya(w.id) && !['pelatih', 'targetLatihan', 'kebugaran', 'usahaTerbaik'].includes(w.id),
  )
  if (pintasan.length) {
    kartu.push(
      <Card key="pintasan">
        <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">Pintasan</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {pintasan.map((w) => (
            <Link key={w.id} to={w.ke}
              className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 transition hover:bg-white/10">
              <span className="text-base">{w.emoji}</span>
              <span className="truncate text-[12px] font-bold text-white">{w.label}</span>
            </Link>
          ))}
        </div>
      </Card>,
    )
  }

  return (
    <div className="space-y-3">
      {kartu}

      <button onClick={() => setBuka(true)}
        className="w-full rounded-2xl border border-dashed border-white/15 py-2.5 text-[12px] font-bold text-slate-400 transition hover:border-white/30 hover:text-white">
        ⚙︎ Atur kartu beranda
      </button>

      {/* Lewat Portal, dan bukan sekadar z-index tinggi: kartu ini dirender di
          dalam feed, yang berada dalam konteks penumpukan tersendiri, sehingga
          z-50 di sini tetap kalah oleh bilah navigasi bawah dan tombol
          "Selesai" menjadi tidak bisa diketuk di layar ponsel. */}
      {buka && (
        <Portal>
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => setBuka(false)}>
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-slate-900 p-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-white">Atur kartu beranda</h2>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">
                  Pilih yang ingin Anda lihat setiap membuka aplikasi. Kartu tanpa data tidak akan
                  tampil meski dinyalakan.
                </p>
              </div>
              <button onClick={() => setBuka(false)} aria-label="Tutup"
                className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">✕</button>
            </div>

            <div className="mt-4 space-y-1.5">
              {WIDGETS.map((w) => {
                const on = aktif.includes(w.id)
                return (
                  <button key={w.id} onClick={() => setAktif(alihkanWidget(w.id))}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${on ? 'bg-brand/15' : 'bg-white/5'}`}>
                    <span className="text-lg">{w.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-white">{w.label}</span>
                      <span className="block text-[11px] leading-snug text-slate-400">{w.ringkas}</span>
                    </span>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[12px] font-black ${on ? 'bg-brand text-white' : 'bg-white/10 text-slate-500'}`}>
                      {on ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => { simpanWidget([]); setAktif([]) }}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-[12px] font-bold text-white">Kosongkan</button>
              <button onClick={() => { simpanWidget(widgetBawaan()); setAktif(widgetBawaan()) }}
                className="flex-1 rounded-xl bg-white/10 py-2.5 text-[12px] font-bold text-white">Bawaan</button>
              <button onClick={() => setBuka(false)}
                className="flex-1 rounded-xl bg-brand py-2.5 text-[12px] font-bold text-white">Selesai</button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  )
}

function Mini({ label, nilai, warna }: { label: string; nilai: number; warna: string }) {
  return (
    <div>
      <div className="text-base font-black tabular-nums" style={{ color: warna }}>{nilai}</div>
      <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  )
}

export default WidgetBeranda
