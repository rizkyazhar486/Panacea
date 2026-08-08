import { useMemo, useState } from 'react'
import { Card, SectionTitle, Badge, Field, inputClass } from '../components/ui'
import { IconRun, IconActivity, IconHeart, IconTimer, IconChartUp } from '../components/icons'
import {
  SPORTS, POWER_ZONES, SWIM_ZONES, SPEED_WORK, BIKE_FIT, CYCLING_COUNTER, CROSS_RULES,
  ftpFrom20Min, powerRange, wattPerKg, wkgBand, criticalSwimSpeed, weeklyMultiSport,
  type Sport, type Goal,
} from '../lib/multiSport'
import { parsePace, fmtPace, trainingPaces, RUN_ZONES } from '../lib/baseTraining'

// ─────────────────────────────────────────────────────────────────────────────
// Lari, Sepeda, Renang — zona intensitas per cabang, kerja kecepatan, dan
// sisi postur yang berbeda tajam di antara ketiganya. Semua hitungan offline.
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'banding' | 'lari' | 'sepeda' | 'renang' | 'kecepatan' | 'jadwal'

const ARAH_STYLE: Record<string, string> = {
  memperbaiki: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  merusak: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  netral: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
}
const ARAH_LABEL: Record<string, string> = {
  memperbaiki: 'Memperbaiki postur',
  merusak: 'Berisiko merusak postur',
  netral: 'Netral terhadap postur',
}

export function MultiSport() {
  const [tab, setTab] = useState<Tab>('banding')

  return (
    <div className="space-y-4">
      <SectionTitle icon={<IconRun />} title="Lari, Sepeda, Renang" subtitle="Intensity zones, speed work, and posture for three sports" />

      <Card>
        <p className="text-sm text-slate-300 leading-relaxed">
          Intensitas pada ketiga cabang ini diatur oleh prinsip yang sama — ambang laktat — tetapi
          <strong className="text-white"> satuannya berbeda</strong>: lari memakai pace, sepeda memakai watt,
          renang memakai waktu per 100 meter. Menyamakan "zona 3" antar cabang tanpa mengukur ambang
          masing-masing menghasilkan intensitas yang salah pada hampir setiap sesi. Halaman ini menghitung
          ketiganya secara terpisah.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([
          ['banding', '⚖️ Perbandingan'],
          ['lari', '🏃 Lari'],
          ['sepeda', '🚴 Sepeda'],
          ['renang', '🏊 Renang'],
          ['kecepatan', '⚡ Kerja Kecepatan'],
          ['jadwal', '🗓️ Jadwal'],
        ] as [Tab, string][]).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition ${
              tab === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'banding' && <CompareTab />}
      {tab === 'lari' && <RunTab />}
      {tab === 'sepeda' && <BikeTab />}
      {tab === 'renang' && <SwimTab />}
      {tab === 'kecepatan' && <SpeedTab />}
      {tab === 'jadwal' && <ScheduleTab />}

      <Card>
        <SectionTitle icon={<IconHeart />} title="Aturan lintas cabang" />
        <div className="space-y-3 mt-2">
          {CROSS_RULES.map((r) => (
            <div key={r.judul} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-white">{r.judul}</div>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{r.isi}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CompareTab() {
  return (
    <div className="space-y-4">
      {SPORTS.map((s) => (
        <Card key={s.key}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-lg font-semibold text-white">{s.nama}</span>
            <span className={`px-2 py-0.5 rounded-md text-xs border ${ARAH_STYLE[s.posturArah]}`}>
              {ARAH_LABEL[s.posturArah]}
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-sm">
            <div><span className="text-slate-500">Satuan intensitas:</span> <span className="text-slate-300">{s.satuan}</span></div>
            <div><span className="text-slate-500">Cara mengukur ambang:</span> <span className="text-slate-300">{s.tesAmbang}</span></div>
          </div>

          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Beban sendi</div>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{s.bebanSendi}</p>
          </div>

          <div className={`mt-2 rounded-lg border p-3 ${ARAH_STYLE[s.posturArah]}`}>
            <div className="text-xs uppercase tracking-wide opacity-80">Pengaruh terhadap postur</div>
            <p className="text-sm mt-1 leading-relaxed opacity-95">{s.postur}</p>
          </div>

          <div className="mt-2 text-sm text-amber-300/90">
            <span className="text-amber-500/80">Cedera khas:</span> {s.cederaKhas}
          </div>
        </Card>
      ))}
    </div>
  )
}

function RunTab() {
  const [racePace, setRacePace] = useState('5:30')
  const sec = useMemo(() => parsePace(racePace), [racePace])
  const res = useMemo(() => (sec == null ? null : trainingPaces(sec)), [sec])

  return (
    <Card>
      <SectionTitle icon={<IconTimer />} title="Zona pace lari" subtitle="From your race pace" />
      <Field label="Pace lomba (menit:detik per km)">
        <input className={inputClass} value={racePace} onChange={(e) => setRacePace(e.target.value)} inputMode="numeric" />
      </Field>
      {sec == null && <p className="text-sm text-amber-300 mt-2">Format menit:detik, misalnya 5:30.</p>}
      {res && (
        <div className="grid gap-2 sm:grid-cols-2 mt-3">
          {RUN_ZONES.map((z) => {
            const [a, b] = res.zones[z.key]
            return (
              <div key={z.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-white text-sm">{z.name}</span>
                  <span className="text-base font-bold tabular-nums text-sky-300">{fmtPace(a)}–{fmtPace(b)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{z.tujuan}</div>
              </div>
            )
          })}
        </div>
      )}
      <p className="text-sm text-slate-400 mt-4 leading-relaxed">
        Untuk penjelasan lengkap tiap jenis lari beserta kesalahan yang paling sering, lihat halaman
        <strong className="text-white"> Foundation Training &amp; Postur</strong>.
      </p>
    </Card>
  )
}

function BikeTab() {
  const [watt, setWatt] = useState('200')
  const [berat, setBerat] = useState('65')

  const ftp = useMemo(() => ftpFrom20Min(Number(watt)), [watt])
  const wkg = useMemo(() => (ftp == null ? null : wattPerKg(ftp, Number(berat))), [ftp, berat])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconChartUp />} title="Zona daya sepeda" subtitle="From an all-out 20-minute test" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Daya rata-rata 20 menit (watt)">
            <input className={inputClass} value={watt} onChange={(e) => setWatt(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Berat badan (kg)">
            <input className={inputClass} value={berat} onChange={(e) => setBerat(e.target.value)} inputMode="decimal" />
          </Field>
        </div>

        {ftp == null ? (
          <p className="text-sm text-amber-300 mt-3">Masukkan daya rata-rata dalam watt.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <div className="text-sm text-slate-400">
                FTP ≈ <span className="text-white font-bold text-lg tabular-nums">{ftp}</span> watt
                <span className="text-xs text-slate-500 ml-1">(95% dari daya 20 menit)</span>
              </div>
              {wkg != null && (
                <div className="text-sm text-slate-400">
                  <span className="text-white font-bold tabular-nums">{wkg}</span> watt/kg
                </div>
              )}
            </div>
            {wkg != null && <div className="text-xs text-slate-500 mt-1">{wkgBand(wkg)}</div>}

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm min-w-[460px]">
                <thead>
                  <tr className="text-slate-400 border-b border-white/10">
                    <th className="text-left py-2 pr-3 font-medium">Zona</th>
                    <th className="text-left py-2 pr-3 font-medium">Watt</th>
                    <th className="text-left py-2 pr-3 font-medium">Tujuan</th>
                    <th className="text-left py-2 font-medium">Durasi</th>
                  </tr>
                </thead>
                <tbody>
                  {POWER_ZONES.map((z) => {
                    const [lo, hi] = powerRange(ftp, z)
                    return (
                      <tr key={z.n} className="border-b border-white/5">
                        <td className="py-2 pr-3 text-white font-semibold whitespace-nowrap">Z{z.n} {z.nama}</td>
                        <td className="py-2 pr-3 tabular-nums text-sky-300 whitespace-nowrap">{lo}–{hi ?? '∞'}</td>
                        <td className="py-2 pr-3 text-slate-400">{z.tujuan}</td>
                        <td className="py-2 text-slate-500 whitespace-nowrap">{z.durasi}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card>
        <SectionTitle icon={<IconActivity />} title="Penyetelan sepeda" subtitle="The numbers behind knee, neck, and back pain" />
        <div className="space-y-2 mt-2">
          {BIKE_FIT.map((f) => (
            <div key={f.bagian} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="font-semibold text-white text-sm">{f.bagian}</div>
              <div className="text-sm text-slate-400 mt-1">{f.patokan}</div>
              <div className="text-sm text-amber-300/90 mt-1"><span className="text-amber-500/80">Bila salah:</span> {f.bilaSalah}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <div className="text-sm font-semibold text-rose-300">Sepeda memerlukan latihan penyeimbang — renang tidak</div>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Bersepeda menahan punggung membungkuk dengan leher mendongak selama berjam-jam, yaitu persis pola
            postur yang ingin diperbaiki. Tanpa penyeimbang, semakin banyak bersepeda semakin kuat pola itu
            tertanam.
          </p>
        </div>
        <div className="space-y-2 mt-3">
          {CYCLING_COUNTER.map((c) => (
            <div key={c.nama} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-white text-sm">{c.nama}</span>
                <span className="text-xs text-slate-400">{c.dosis}</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{c.kenapa}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SwimTab() {
  const [t400, setT400] = useState('7:00')
  const [t200, setT200] = useState('3:20')

  const css = useMemo(() => {
    const a = parsePace(t400)
    const b = parsePace(t200)
    if (a == null || b == null) return null
    return criticalSwimSpeed(a, b)
  }, [t400, t200])

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={<IconTimer />} title="Critical Swim Speed" subtitle="From all-out 400 m and 200 m tests" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Waktu 400 m (menit:detik)">
            <input className={inputClass} value={t400} onChange={(e) => setT400(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Waktu 200 m (menit:detik)">
            <input className={inputClass} value={t200} onChange={(e) => setT200(e.target.value)} inputMode="numeric" />
          </Field>
        </div>

        {css == null ? (
          <p className="text-sm text-amber-300 mt-3">
            Masukkan kedua waktu dalam format menit:detik. Waktu 400 m harus lebih lama daripada 200 m.
          </p>
        ) : (
          <>
            <div className="mt-3 text-sm text-slate-400">
              CSS ≈ <span className="text-white font-bold text-lg tabular-nums">{fmtPace(css.cssPer100)}</span> per 100 m
              <span className="text-xs text-slate-500 ml-2">({css.css} m/detik)</span>
            </div>

            <div className="grid gap-2 mt-3">
              {SWIM_ZONES.map((z) => {
                const lo = css.cssPer100 + z.offset[0]
                const hi = css.cssPer100 + z.offset[1]
                return (
                  <div key={z.nama} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-white text-sm">{z.nama}</span>
                      <span className="text-base font-bold tabular-nums text-sky-300">
                        {fmtPace(Math.min(lo, hi))}–{fmtPace(Math.max(lo, hi))} /100 m
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{z.tujuan}</div>
                    <div className="text-sm text-slate-400 mt-1">{z.contoh}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <Card>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="text-sm font-semibold text-emerald-300">Renang adalah satu-satunya dari ketiganya yang memperbaiki postur</div>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Gaya bebas dan gaya punggung menarik lengan ke belakang melawan tahanan air, sehingga menguatkan
            latissimus dorsi, rhomboid, dan trapezius bawah — otot yang justru melemah akibat duduk dan berdiri
            membungkuk. Gerakannya juga meregangkan dada dan melatih rotasi punggung atas yang biasanya kaku.
            Untuk tujuan postur, <strong className="text-white">gaya punggung adalah yang paling bermanfaat</strong>.
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mt-3">
          <div className="text-sm font-semibold text-amber-300">Satu hal yang perlu dijaga</div>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Nyeri bahu pada perenang hampir selalu berasal dari volume yang naik terlalu cepat dan dari tangan
            yang menyeberang garis tengah tubuh saat masuk air. Bila bahu mulai nyeri, yang perlu diperbaiki
            lebih dahulu adalah teknik dan jarak tempuh — bukan menambah latihan bahu.
          </p>
        </div>
      </Card>
    </div>
  )
}

function SpeedTab() {
  const [f, setF] = useState<Sport | 'semua'>('semua')
  const list = useMemo(() => (f === 'semua' ? SPEED_WORK : SPEED_WORK.filter((s) => s.sport === f)), [f])

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-slate-300 leading-relaxed">
          Kerja kecepatan berbeda dari kerja daya tahan pada satu hal yang paling sering dilanggar:
          <strong className="text-white"> jeda harus panjang sampai benar-benar pulih</strong>. Begitu jeda
          dipersingkat, sesi berubah menjadi latihan daya tahan anaerobik dan tujuan kecepatannya hilang.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([['semua', 'Semua'], ['lari', '🏃 Lari'], ['sepeda', '🚴 Sepeda'], ['renang', '🏊 Renang']] as [Sport | 'semua', string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={`px-3 py-1 rounded-lg text-xs border ${f === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {list.map((s) => (
        <Card key={s.nama + s.sport}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{s.nama}</span>
            <Badge>{SPORTS.find((x) => x.key === s.sport)?.nama}</Badge>
            <span className="text-xs text-slate-500">{s.kapan}</span>
          </div>
          <div className="text-sm text-sky-300 mt-2">{s.isi}</div>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">{s.kenapa}</p>
        </Card>
      ))}
    </div>
  )
}

function ScheduleTab() {
  const [goal, setGoal] = useState<Goal>('kebugaran')
  const plan = useMemo(() => weeklyMultiSport(goal), [goal])

  const warna: Record<string, string> = {
    lari: 'border-sky-500/30 bg-sky-500/10',
    sepeda: 'border-amber-500/30 bg-amber-500/10',
    renang: 'border-emerald-500/30 bg-emerald-500/10',
    kekuatan: 'border-violet-500/30 bg-violet-500/10',
    pulih: 'border-slate-500/30 bg-slate-500/10',
  }
  const emoji: Record<string, string> = { lari: '🏃', sepeda: '🚴', renang: '🏊', kekuatan: '🏋️', pulih: '😴' }

  return (
    <Card>
      <SectionTitle icon={<IconTimer />} title="Susunan seminggu" subtitle="Berbeda menurut tujuan" />

      <div className="flex flex-wrap gap-2 mt-3">
        {([
          ['kecepatan', '⚡ Kecepatan'],
          ['kebugaran', '❤️ Kebugaran umum'],
          ['postur', '🧍 Postur'],
        ] as [Goal, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setGoal(k)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${goal === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-slate-400'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {goal === 'postur' && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 mt-3">
          <p className="text-sm text-slate-300 leading-relaxed">
            Pada tujuan postur, porsi <strong className="text-white">renang dan latihan tarik diperbesar</strong>
            {' '}sementara <strong className="text-white">sepeda dibatasi dan selalu disusul penyeimbang</strong> —
            karena keduanya bekerja ke arah yang berlawanan terhadap postur.
          </p>
        </div>
      )}

      <div className="space-y-2 mt-4">
        {plan.map((d) => (
          <div key={d.hari} className={`rounded-lg border p-3 ${warna[d.sport]}`}>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-white w-16">{d.hari}</span>
              <span>{emoji[d.sport]}</span>
              <span className="text-sm text-slate-300 flex-1 min-w-[180px]">{d.isi}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 pl-16">{d.fokus}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default MultiSport
