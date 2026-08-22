import { useMemo, useState } from 'react'
import { Prosa } from '../components/Prosa'
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
  netral: 'bg-slate-500/10 border-slate-500/30 text-neutral-600',
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
      <SectionTitle icon={<IconRun />} title="Running, Cycling, Swimming" subtitle="Zona intensitas, latihan kecepatan, dan postur untuk tiga cabang" />

      <Card>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Intensity in all three sports is governed by the same principle — the lactate threshold — but
          <strong className="text-ink"> the units differ</strong>: running uses pace, cycling uses watts,
          swimming uses time per 100 metres. Treating "zone 3" as the same across sports without measuring
          each threshold produces the wrong intensity in nearly every session. This page calculates all
          three separately.
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
              tab === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500 hover:text-ink'
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
        <SectionTitle icon={<IconHeart />} title="Aturan yang berlaku pada ketiganya" />
        <div className="space-y-3 mt-2">
          {CROSS_RULES.map((r) => (
            <div key={r.judul} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm font-semibold text-ink">{r.judul}</div>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{r.isi}</p>
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
            <span className="text-lg font-semibold text-ink">{s.nama}</span>
            <span className={`px-2 py-0.5 rounded-md text-xs border ${ARAH_STYLE[s.posturArah]}`}>
              {ARAH_LABEL[s.posturArah]}
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-sm">
            <div><span className="text-slate-500">Intensity unit:</span> <span className="text-neutral-600">{s.satuan}</span></div>
            <div><span className="text-slate-500">How threshold is measured:</span> <span className="text-neutral-600">{s.tesAmbang}</span></div>
          </div>

          <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Joint load</div>
            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{s.bebanSendi}</p>
          </div>

          <div className={`mt-2 rounded-lg border p-3 ${ARAH_STYLE[s.posturArah]}`}>
            <div className="text-xs uppercase tracking-wide opacity-80">Effect on posture</div>
            <p className="text-sm mt-1 leading-relaxed opacity-95">{s.postur}</p>
          </div>

          <div className="mt-2 text-sm text-amber-300/90">
            <span className="text-amber-500/80">Typical injuries:</span> {s.cederaKhas}
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
      <SectionTitle icon={<IconTimer />} title="Running pace zones" subtitle="Dari pace lomba Anda" />
      <Field label="Race pace (min:sec per km)">
        <input className={inputClass} value={racePace} onChange={(e) => setRacePace(e.target.value)} inputMode="numeric" />
      </Field>
      {sec == null && <p className="text-sm text-amber-300 mt-2">Format min:sec, for example 5:30.</p>}
      {res && (
        <div className="grid gap-2 sm:grid-cols-2 mt-3">
          {RUN_ZONES.map((z) => {
            const [a, b] = res.zones[z.key]
            return (
              <div key={z.key} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink text-sm">{z.name}</span>
                  <span className="text-base font-bold tabular-nums text-sky-300">{fmtPace(a)}–{fmtPace(b)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{z.tujuan}</div>
              </div>
            )
          })}
        </div>
      )}
      <p className="text-sm text-neutral-500 mt-4 leading-relaxed">
        For a full explanation of each run type and the mistakes made most often, see the
        <strong className="text-ink"> Foundation Training &amp; Posture</strong> page.
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
        <SectionTitle icon={<IconChartUp />} title="Cycling power zones" subtitle="Dari tes 20 menit sekuat tenaga" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Average 20-minute power (watts)">
            <input className={inputClass} value={watt} onChange={(e) => setWatt(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Body weight (kg)">
            <input className={inputClass} value={berat} onChange={(e) => setBerat(e.target.value)} inputMode="decimal" />
          </Field>
        </div>

        {ftp == null ? (
          <p className="text-sm text-amber-300 mt-3">Enter your average power in watts.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <div className="text-sm text-neutral-500">
                FTP ≈ <span className="text-ink font-bold text-lg tabular-nums">{ftp}</span> watt
                <span className="text-xs text-slate-500 ml-1">(95% of the 20-minute power)</span>
              </div>
              {wkg != null && (
                <div className="text-sm text-neutral-500">
                  <span className="text-ink font-bold tabular-nums">{wkg}</span> watt/kg
                </div>
              )}
            </div>
            {wkg != null && <div className="text-xs text-slate-500 mt-1">{wkgBand(wkg)}</div>}

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm min-w-[460px]">
                <thead>
                  <tr className="text-neutral-500 border-b border-white/10">
                    <th className="text-left py-2 pr-3 font-medium">Zone</th>
                    <th className="text-left py-2 pr-3 font-medium">Watt</th>
                    <th className="text-left py-2 pr-3 font-medium">Purpose</th>
                    <th className="text-left py-2 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {POWER_ZONES.map((z) => {
                    const [lo, hi] = powerRange(ftp, z)
                    return (
                      <tr key={z.n} className="border-b border-white/5">
                        <td className="py-2 pr-3 text-ink font-semibold whitespace-nowrap">Z{z.n} {z.nama}</td>
                        <td className="py-2 pr-3 tabular-nums text-sky-300 whitespace-nowrap">{lo}–{hi ?? '∞'}</td>
                        <td className="py-2 pr-3 text-neutral-500">{z.tujuan}</td>
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
        <SectionTitle icon={<IconActivity />} title="Bike fit" subtitle="Angka di balik nyeri lutut, leher, dan punggung" />
        <div className="space-y-2 mt-2">
          {BIKE_FIT.map((f) => (
            <div key={f.bagian} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="font-semibold text-ink text-sm">{f.bagian}</div>
              <div className="text-sm text-neutral-500 mt-1">{f.patokan}</div>
              <div className="text-sm text-amber-300/90 mt-1"><span className="text-amber-500/80">If it is wrong:</span> {f.bilaSalah}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3">
          <div className="text-sm font-semibold text-rose-300">Cycling needs a counterweight — swimming does not</div>
          <Prosa kelas="text-sm text-neutral-600 mt-1 leading-relaxed">Bersepeda menahan punggung membulat dengan leher menengadah selama berjam-jam — persis pola postur yang sedang Anda perbaiki. Tanpa penyeimbang, makin banyak bersepeda makin kuat pola itu tertanam.</Prosa>
        </div>
        <div className="space-y-2 mt-3">
          {CYCLING_COUNTER.map((c) => (
            <div key={c.nama} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-ink text-sm">{c.nama}</span>
                <span className="text-xs text-neutral-500">{c.dosis}</span>
              </div>
              <p className="text-sm text-neutral-500 mt-1">{c.kenapa}</p>
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
        <SectionTitle icon={<IconTimer />} title="Critical Swim Speed" subtitle="Dari tes 400 m dan 200 m sekuat tenaga" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="400 m time (min:sec)">
            <input className={inputClass} value={t400} onChange={(e) => setT400(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="200 m time (min:sec)">
            <input className={inputClass} value={t200} onChange={(e) => setT200(e.target.value)} inputMode="numeric" />
          </Field>
        </div>

        {css == null ? (
          <p className="text-sm text-amber-300 mt-3">
            Masukkan kedua waktu dalam format menit:detik. Waktu 400 m harus lebih lama daripada 200 m.
          </p>
        ) : (
          <>
            <div className="mt-3 text-sm text-neutral-500">
              CSS ≈ <span className="text-ink font-bold text-lg tabular-nums">{fmtPace(css.cssPer100)}</span> per 100 m
              <span className="text-xs text-slate-500 ml-2">({css.css} m/detik)</span>
            </div>

            <div className="grid gap-2 mt-3">
              {SWIM_ZONES.map((z) => {
                const lo = css.cssPer100 + z.offset[0]
                const hi = css.cssPer100 + z.offset[1]
                return (
                  <div key={z.nama} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-ink text-sm">{z.nama}</span>
                      <span className="text-base font-bold tabular-nums text-sky-300">
                        {fmtPace(Math.min(lo, hi))}–{fmtPace(Math.max(lo, hi))} /100 m
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{z.tujuan}</div>
                    <div className="text-sm text-neutral-500 mt-1">{z.contoh}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Card>

      <Card>
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <div className="text-sm font-semibold text-emerald-300">Swimming is the only one of the three that improves posture</div>
          <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
            Gaya bebas dan gaya punggung menarik lengan ke belakang melawan tahanan air, sehingga menguatkan
            latissimus dorsi, rhomboid, dan trapezius bawah — otot yang justru melemah akibat duduk dan berdiri
            membungkuk. Gerakannya juga meregangkan dada dan melatih rotasi punggung atas yang biasanya kaku.
            Untuk tujuan postur, <strong className="text-ink">gaya punggung adalah yang paling bermanfaat</strong>.
          </p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 mt-3">
          <div className="text-sm font-semibold text-amber-300">One thing to watch</div>
          <Prosa kelas="text-sm text-neutral-600 mt-1 leading-relaxed">Nyeri bahu pada perenang hampir selalu berasal dari jarak tempuh yang naik terlalu cepat dan dari tangan yang melewati garis tengah tubuh saat masuk air. Bila bahu mulai nyeri, yang perlu dibenahi lebih dahulu adalah teknik dan jarak tempuh — bukan menambah latihan bahu.</Prosa>
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
        <p className="text-sm text-neutral-600 leading-relaxed">
          Speed work differs from endurance work in the one respect that is most often broken:
          <strong className="text-ink"> the rest must be long enough for full recovery</strong>. The moment the rest
          is shortened, the session becomes anaerobic endurance work and its purpose as speed training is lost.
        </p>
      </Card>

      <div className="flex flex-wrap gap-2">
        {([['semua', 'Semua'], ['lari', '🏃 Lari'], ['sepeda', '🚴 Sepeda'], ['renang', '🏊 Renang']] as [Sport | 'semua', string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setF(k)}
            className={`px-3 py-1 rounded-lg text-xs border ${f === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {list.map((s) => (
        <Card key={s.nama + s.sport}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ink">{s.nama}</span>
            <Badge>{SPORTS.find((x) => x.key === s.sport)?.nama}</Badge>
            <span className="text-xs text-slate-500">{s.kapan}</span>
          </div>
          <div className="text-sm text-sky-300 mt-2">{s.isi}</div>
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{s.kenapa}</p>
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
      <SectionTitle icon={<IconTimer />} title="Bagaimana satu pekan disusun" subtitle="Berubah mengikuti sasaran Anda" />

      <div className="flex flex-wrap gap-2 mt-3">
        {([
          ['kecepatan', '⚡ Kecepatan'],
          ['kebugaran', '❤️ Kebugaran umum'],
          ['postur', '🧍 Postur'],
        ] as [Goal, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setGoal(k)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${goal === k ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-neutral-500'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {goal === 'postur' && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 mt-3">
          <p className="text-sm text-neutral-600 leading-relaxed">
            With posture as the goal, <strong className="text-ink">swimming and pulling work are increased</strong>
            {' '}sementara <strong className="text-ink">cycling is capped and always followed by its counterweight</strong> —
            because the two work in opposite directions on posture.
          </p>
        </div>
      )}

      <div className="space-y-2 mt-4">
        {plan.map((d) => (
          <div key={d.hari} className={`rounded-lg border p-3 ${warna[d.sport]}`}>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-ink w-16">{d.hari}</span>
              <span>{emoji[d.sport]}</span>
              <span className="text-sm text-neutral-600 flex-1 min-w-[180px]">{d.isi}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 pl-16">{d.fokus}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default MultiSport
