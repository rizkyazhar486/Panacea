import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle } from '../components/ui'
import { IconHeart, IconActivity, IconTimer } from '../components/icons'
import { api, backendEnabled, type SleepNight } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Sleep Pattern — per tahapan, per malam.
//
// Total jam tidur adalah angka yang paling sering dilihat dan paling sedikit
// artinya. Tujuh jam yang terpecah-pecah dengan tidur dalam nyaris nol tidak
// sama dengan tujuh jam yang utuh, dan hanya rincian tahapan yang bisa
// membedakannya. Bagi orang yang jadwal jaganya berantakan, yang paling
// menentukan justru KETERATURAN JAM — dan itu pun tidak terlihat dari total.
// ─────────────────────────────────────────────────────────────────────────────

const WARNA = {
  deep: '#4f46e5',
  rem: '#0ea5e9',
  core: '#34d399',
  awake: '#f59e0b',
}

interface Ringkas {
  malam: number
  reratatotal: number
  rerataDeep?: number
  rerataRem?: number
  /** Simpangan baku jam mulai tidur, dalam menit — ukuran keteraturan. */
  keteraturanMenit?: number
  rerataJamTidur?: number
  rerataJamBangun?: number
}

function jamDesimal(iso?: string): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() + d.getMinutes() / 60
}

/** Jam tidur melewati tengah malam, jadi 23.5 dan 0.5 harus dihitung berdekatan. */
function rerataJamMelingkar(jam: number[]): number | null {
  if (!jam.length) return null
  const sin = jam.reduce((a, h) => a + Math.sin((h / 24) * 2 * Math.PI), 0) / jam.length
  const cos = jam.reduce((a, h) => a + Math.cos((h / 24) * 2 * Math.PI), 0) / jam.length
  let sudut = Math.atan2(sin, cos)
  if (sudut < 0) sudut += 2 * Math.PI
  return (sudut / (2 * Math.PI)) * 24
}

function simpanganMelingkarMenit(jam: number[]): number | null {
  if (jam.length < 2) return null
  const sin = jam.reduce((a, h) => a + Math.sin((h / 24) * 2 * Math.PI), 0) / jam.length
  const cos = jam.reduce((a, h) => a + Math.cos((h / 24) * 2 * Math.PI), 0) / jam.length
  const R = Math.sqrt(sin * sin + cos * cos)
  if (R >= 1) return 0
  const sd = Math.sqrt(-2 * Math.log(R)) // radian
  return Math.round((sd / (2 * Math.PI)) * 24 * 60)
}

function fmtJam(h: number | null): string {
  if (h == null) return '—'
  const jam = Math.floor(h) % 24
  const menit = Math.round((h - Math.floor(h)) * 60)
  return `${String(jam).padStart(2, '0')}.${String(menit).padStart(2, '0')}`
}

function fmtDurasi(h?: number): string {
  if (h == null || !Number.isFinite(h)) return '—'
  // Round to whole minutes FIRST, then split. Splitting first and rounding the
  // remainder printed "5 j 60 m" for 5.996 hours.
  const totalMenit = Math.round(h * 60)
  const jam = Math.floor(totalMenit / 60)
  const menit = totalMenit % 60
  return menit === 0 ? `${jam} j` : `${jam} j ${menit} m`
}

export function SleepPattern() {
  const [nights, setNights] = useState<SleepNight[]>([])
  const [memuat, setMemuat] = useState(true)
  const [gagal, setGagal] = useState(false)

  const load = useCallback(() => {
    setMemuat(true)
    api.sleepSeries()
      .then((r) => { setNights(r); setGagal(false) })
      .catch(() => setGagal(true))
      .finally(() => setMemuat(false))
  }, [])

  useEffect(() => {
    if (!backendEnabled) { setMemuat(false); return }
    load()
  }, [load])

  const urut = useMemo(
    () => [...nights].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [nights],
  )

  const ringkas: Ringkas | null = useMemo(() => {
    if (!urut.length) return null
    const totals = urut.map((n) => n.totalH).filter((v): v is number => v != null)
    const deeps = urut.map((n) => n.deepH).filter((v): v is number => v != null)
    const rems = urut.map((n) => n.remH).filter((v): v is number => v != null)
    const mulai = urut.map((n) => jamDesimal(n.start)).filter((v): v is number => v != null)
    const bangun = urut.map((n) => jamDesimal(n.end)).filter((v): v is number => v != null)
    return {
      malam: urut.length,
      reratatotal: totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0,
      rerataDeep: deeps.length ? deeps.reduce((a, b) => a + b, 0) / deeps.length : undefined,
      rerataRem: rems.length ? rems.reduce((a, b) => a + b, 0) / rems.length : undefined,
      keteraturanMenit: simpanganMelingkarMenit(mulai) ?? undefined,
      rerataJamTidur: rerataJamMelingkar(mulai) ?? undefined,
      rerataJamBangun: rerataJamMelingkar(bangun) ?? undefined,
    }
  }, [urut])

  if (!backendEnabled) {
    return (
      <div className="space-y-4">
        <SectionTitle icon={<IconTimer />} title="Sleep Pattern" />
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Stage-by-stage sleep detail is filled in by the server through automatic sync, and the app
            is currently running without one.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={<IconTimer />}
        title="Sleep Pattern"
        subtitle="By stage and by night, from Apple Watch via automatic sync"
      />

      <Card>
        <p className="text-sm text-neutral-600 leading-relaxed">
          Total hours slept is the number people look at most and the one that means least.
          <strong className="text-ink"> Seven broken hours with almost no deep sleep is not the same as
          seven unbroken ones</strong> — and only the stage breakdown can tell them apart.
        </p>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          For anyone on a broken shift pattern, what matters most is not the duration but
          <strong className="text-ink"> the consistency of the timing</strong>. A bedtime that moves every
          night gives the body contradictory time cues, and that produces a tiredness which does not lift
          even when the hours add up.
        </p>
      </Card>

      {gagal ? (
        <Card>
          <p className="text-sm text-neutral-500">Could not load sleep data.</p>
          <button onClick={load} className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">Try again</button>
        </Card>
      ) : memuat ? (
        <Card><p className="text-sm text-slate-500">Loading…</p></Card>
      ) : !urut.length ? (
        <Card>
          <p className="text-sm text-neutral-600 leading-relaxed">No nights recorded yet.</p>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
            Make sure <strong className="text-ink">Sleep Analysis</strong> is ticked in Health Auto Export,
            and that you wear the watch to bed. Stage detail only exists if the watch is worn through the
            night — with just an iPhone beside the bed, the most that gets recorded is time in bed, with no
            stages.
          </p>
          <Link to="/health-data" className="mt-3 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
            Open sync settings →
          </Link>
        </Card>
      ) : (
        <>
          <Card>
            <SectionTitle icon={<IconActivity />} title="Summary" subtitle={`Last ${ringkas!.malam} nights`} />
            <div className="grid grid-cols-2 gap-2 mt-2 sm:grid-cols-4">
              <Stat label="Average sleep" value={fmtDurasi(ringkas!.reratatotal)} />
              <Stat label="Deep sleep" value={fmtDurasi(ringkas!.rerataDeep)} />
              <Stat label="REM" value={fmtDurasi(ringkas!.rerataRem)} />
              <Stat
                label="Consistency"
                value={ringkas!.keteraturanMenit != null ? `±${ringkas!.keteraturanMenit} m` : '—'}
              />
            </div>

            {ringkas!.rerataJamTidur != null && (
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
                On average you fall asleep around <strong className="text-ink">{fmtJam(ringkas!.rerataJamTidur)}</strong>
                {ringkas!.rerataJamBangun != null && <> and wake around <strong className="text-ink">{fmtJam(ringkas!.rerataJamBangun)}</strong></>}.
                {' '}Averaged circularly, so times either side of midnight do not average out to the middle of the day.
              </p>
            )}

            {ringkas!.keteraturanMenit != null && (
              <p className={`mt-2 text-sm leading-relaxed ${ringkas!.keteraturanMenit <= 45 ? 'text-emerald-200/90' : 'text-amber-100/90'}`}>
                {ringkas!.keteraturanMenit <= 45
                  ? `Your bedtime is fairly consistent (moving about ${ringkas!.keteraturanMenit} minutes from night to night). This is the part that matters most, and you already have it.`
                  : `Your bedtime moves about ${ringkas!.keteraturanMenit} minutes from night to night. A shift that size gives the body a moving time cue. If shift work makes a fixed bedtime impossible, the thing that helps most is fixing your WAKE TIME and getting bright light straight after — wake time is far easier to control than the moment you fall asleep.`}
              </p>
            )}
          </Card>

          <Card>
            <SectionTitle title="Night by night" subtitle="Bar length is proportional to time asleep" />
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
              {([['deep', 'Deep'], ['rem', 'REM'], ['core', 'Core'], ['awake', 'Awake']] as const).map(([k, l]) => (
                <span key={k} className="flex items-center gap-1.5 text-neutral-500">
                  <span className="h-2 w-2 rounded-full" style={{ background: WARNA[k] }} />{l}
                </span>
              ))}
            </div>

            <div className="mt-3 space-y-2.5">
              {urut.map((n) => {
                const stages = [
                  { k: 'deep' as const, v: n.deepH ?? 0 },
                  { k: 'rem' as const, v: n.remH ?? 0 },
                  { k: 'core' as const, v: n.coreH ?? 0 },
                  { k: 'awake' as const, v: n.awakeH ?? 0 },
                ]
                const jumlahStage = stages.reduce((a, s) => a + s.v, 0)
                // Skala terhadap 9 jam supaya panjang batang bisa dibandingkan
                // antarmalam, bukan dinormalkan penuh tiap baris.
                const skala = Math.min(100, ((n.totalH ?? jumlahStage) / 9) * 100)
                return (
                  <div key={n.date}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">
                        {new Date(n.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-xs text-neutral-500 tabular-nums">
                        {fmtDurasi(n.totalH)}
                        {n.start && n.end && (
                          <span className="text-slate-500"> · {fmtJam(jamDesimal(n.start))}–{fmtJam(jamDesimal(n.end))}</span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1 h-3 w-full rounded-full bg-white/5">
                      <div className="flex h-3 overflow-hidden rounded-full" style={{ width: `${skala}%` }}>
                        {jumlahStage > 0
                          ? stages.map((s) => s.v > 0 && (
                              <div key={s.k} style={{ width: `${(s.v / jumlahStage) * 100}%`, background: WARNA[s.k] }} title={`${s.k} ${fmtDurasi(s.v)}`} />
                            ))
                          : <div className="w-full bg-slate-600" title="stages not recorded" />}
                      </div>
                    </div>
                    {jumlahStage === 0 && (
                      <p className="mt-0.5 text-[10px] text-slate-500">No stages recorded this night — the watch was probably not worn.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={<IconHeart />} title="How to read this" />
            <div className="mt-2 space-y-2.5">
              {[
                ['Deep sleep', 'Mostly appears in the first third of the night, and it is the stage most tied to physical recovery and growth-hormone release. Going to bed much later cuts into this part first — which is why a late night feels far more damaging than simply sleeping less.'],
                ['REM', 'Concentrated in the last third of the night, and tied to memory and emotional processing. Waking earlier than usual cuts REM first, which shows up as a poor mood even when the hours look adequate.'],
                ['Awake', 'Waking briefly a few times a night is normal and happens to everyone. What is worth attention is many awakenings together with heavy daytime sleepiness.'],
                ['What this tool cannot do', 'Sleep stages from a watch are an ESTIMATE derived from movement and heart rate, not a recording of brain waves. They are good enough for spotting your own trends, and cannot be used to diagnose a sleep disorder. Loud snoring with witnessed pauses in breathing, or heavy daytime sleepiness, needs an in-person assessment and will not be answered by the numbers on this page.'],
              ].map(([judul, isi]) => (
                <div key={judul} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-sm font-semibold text-ink">{judul}</div>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">{isi}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-center">
      <div className="text-base font-semibold text-ink tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

export default SleepPattern
