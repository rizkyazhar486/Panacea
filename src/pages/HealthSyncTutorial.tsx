import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import {
  IconHeart, IconActivity, IconDownload, IconKey, IconShield, IconCheck,
  IconTimer, IconGauge, IconChevronRight,
} from '../components/icons'
import { api, backendEnabled, type SyncFinding } from '../lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Public-facing, step-by-step guide for connecting Apple Watch / Apple Health
// to Panaceamed. Apple doesn't let any website read HealthKit directly, so
// this walks users through the "Health Auto Export" app + webhook bridge that
// /health-data exposes. Written so any user (not just the account owner) can
// follow it end to end without prior context.
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: { title: string; body: string; icon: React.ReactNode }[] = [
  {
    icon: <IconDownload size={22} />,
    title: '1. Download the "Health Auto Export" app',
    body: 'Open the App Store on the iPhone paired with your Apple Watch, search for "Health Auto Export - JSON+CSV" (by HealthyApps), and download it. It\'s a one-time purchase — no subscription.',
  },
  {
    icon: <IconKey size={22} />,
    title: '2. Copy your Private Sync Link',
    body: 'Back in Panaceamed, open Health Data → the "Auto-Sync from Apple Watch" card → press Copy on the Private Sync Link. This link is unique to your account — don\'t share it with anyone.',
  },
  {
    icon: <IconActivity size={22} />,
    title: '3. Create a REST API automation',
    body: 'In the Health Auto Export app: open the Automations tab → press "+" → choose the REST API type. Give it any name, for example "Panaceamed".',
  },
  {
    icon: <IconGauge size={22} />,
    title: '4. Paste the link & choose JSON format',
    body: 'Paste the Private Sync Link into the URL field — ONCE, and nothing else. Clear the field first: if the box already contains part of the address, pasting on top produces a doubled URL like ".../api/health-webhook/https://.../api/health-webhook/TOKEN", which the server can never recognise, and every sync silently fails. Also set the export format to JSON, not CSV.',
  },
  {
    icon: <IconHeart size={22} />,
    title: '5. Select the metrics to sync',
    body: 'Simplest option: select all of them — Panaceamed now reads about forty, and anything it does not recognise is ignored rather than causing an error. At minimum check Heart Rate, Resting Heart Rate, Heart Rate Variability, Sleep Analysis, Step Count, Active Energy, VO2 Max, Weight & Body Mass, and Body Fat Percentage.',
  },
  {
    icon: <IconTimer size={22} />,
    title: '6. Turn on the automatic schedule',
    body: 'Turn on "Automatically Export" and set the interval to every 5 minutes. Once a day is enough to keep a profile current, but it cannot produce a heart-rate log — the next step is what decides how much detail actually arrives.',
  },
  {
    icon: <IconGauge size={22} />,
    title: '7. Set the three options that decide data density',
    body: 'These three matter more than everything above combined, and two of them default the wrong way. Turn Include Workouts ON, turn Aggregate Data OFF, and set the automation interval to 5 minutes. They are detailed in the card below.',
  },
  {
    icon: <IconCheck size={22} />,
    title: '8. Run one manual test',
    body: 'Press the "Export" button in the app to send data for the first time. Reopen Health Data in Panaceamed — your VO2max, HRV, and resting HR will fill in automatically within a few seconds.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// The three options that decide how much detail actually arrives. Given their
// own card because two of them default the wrong way, and because someone can
// otherwise sync faithfully for months and still receive one number an hour.
// Label wording shifts a little between app versions, so each row says what to
// look for rather than promising an exact screen position.
// ─────────────────────────────────────────────────────────────────────────────
const DENSITY: { name: string; set: string; where: string; why: string; ifWrong: string }[] = [
  {
    name: 'Include Workouts',
    set: 'ON',
    where: 'Inside the automation you created, in the same list of toggles as the metric selection. Sometimes labelled "Workouts" or "Export Workouts".',
    why: 'The heart-rate series recorded during a workout is far denser than the daily summary — it is the closest thing to continuous data that exists. It also carries distance, pace, cadence and the post-session recovery series.',
    ifWrong: 'Every run you do is never sent at all, even though your daily metrics arrive perfectly. This is the single most common reason a heart-rate log stays empty.',
  },
  {
    name: 'Aggregate Data',
    set: 'OFF',
    where: 'In the automation settings, near the export format. May appear as "Aggregate" with a separate "Aggregation interval" underneath.',
    why: 'When on, the app compresses samples into one Min/Average/Max row per interval. Turning it off sends the raw samples instead.',
    ifWrong: 'You get one point per minute even though the watch recorded roughly every 5 seconds — about a twelvefold loss of detail during exercise. Measured on a real export: 60 seconds between points where 5 was available.',
  },
  {
    name: 'Automation interval',
    set: 'Every 5 minutes',
    where: 'The schedule or cadence field of the automation, next to "Automatically Export".',
    why: 'Controls how long data waits on the phone before being sent. It changes freshness, not density.',
    ifWrong: 'At 15 minutes or once a day the log runs that far behind. Going below 5 minutes adds nothing, because Apple Health does not write faster than that anyway.',
  },
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Why can\'t it work directly without an extra app?',
    a: 'Apple deliberately restricts HealthKit (Apple Health data) so it can only be read by native apps on the device itself — not by any website/browser, including Panaceamed. Health Auto Export acts as an official bridge that is widely used for cases like this.',
  },
  {
    q: 'Is it safe to share the Private Sync Link with that app?',
    a: 'Yes — the link is used one-way only (Health Auto Export → Panaceamed server) and can only write data to your own account, not read anyone else\'s data. Still, don\'t spread the link to others; if it leaks, regenerate it via the "Regenerate link" button on the Health Data page.',
  },
  {
    q: 'Where does the data go? Does Panaceamed store my raw file?',
    a: 'The raw file itself is never stored. The server extracts about forty metrics, plus your heart-rate samples, sleep stages and workout sessions, and keeps those — that is what makes the heart-rate log and the sleep breakdown possible. Everything else in the payload is discarded. You can wipe the stored series at any time from the Heart Rate Log page.',
  },
  {
    q: 'Can it show my heart rate live, second by second?',
    a: 'No, and no app can. Apple Watch does not record heart rate every second: roughly every 5 seconds during a workout, and only every few minutes at rest. That data simply does not exist in Apple Health, so nothing can export it. Combined with the minutes-scale automation interval, the honest ceiling is every sample Apple Health actually holds, arriving a few minutes late — a log, not a live monitor.',
  },
  {
    q: 'I set everything up but the heart-rate log stays empty.',
    a: 'Almost always one of two things. First, Include Workouts is off, so the densest data never leaves the phone. Second, the sync URL was pasted twice into the same field and is doubled — open the automation and read the whole URL to the end. The Sync Diagnostics tool on the Health Data page will tell you which metrics are actually arriving.',
  },
  {
    q: 'Can I use Android / Garmin / Samsung Health?',
    a: 'For now this automatic path is Apple Health only (iPhone + Apple Watch). For other devices, use the manual export-file import or enter your data directly in the form — both are on the Health Data page.',
  },
  {
    q: 'Why isn\'t my data showing up after setup?',
    a: 'Check: (1) the export format in the app must be JSON, not CSV, (2) the link is pasted in full without being truncated, (3) at least one supported metric is checked, (4) try pressing Export manually once to trigger the first send.',
  },
]

export function HealthSyncTutorial() {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!backendEnabled) return
    api.getHealthWebhookToken()
      .then((token) => setUrl(`${(import.meta.env.VITE_API_URL as string)?.replace(/\/$/, '') || ''}/api/health-webhook/${token}`))
      .catch(() => {})
  }, [])

  // Diagnosis of what has ACTUALLY been arriving. Without this the only way to
  // find a wrong exporter setting is to read the config file by hand — the
  // server sees every delivery and can name the setting itself.
  const [diag, setDiag] = useState<{ findings: SyncFinding[]; deliveries: number; lastAt: string | null } | null>(null)
  const [cek, setCek] = useState(false)

  const jalankanDiagnosa = useCallback(() => {
    setCek(true)
    api.syncDiagnosis().then(setDiag).catch(() => setDiag(null)).finally(() => setCek(false))
  }, [])

  useEffect(() => { if (backendEnabled) jalankanDiagnosa() }, [jalankanDiagnosa])

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle icon={<IconHeart size={20} />} title="Connect Apple Watch to Panaceamed"
          subtitle="Full guide — anyone can follow it" />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
          A website can't read Apple Health directly — this is an official Apple restriction, not a Panaceamed limitation. The solution: a bridge app called <b>Health Auto Export</b> that sends your HealthKit data to the Panaceamed server on a schedule. Follow the 7 steps below — set it up once, and it runs automatically from then on.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="brand">One-time setup</Badge>
          <Badge tone="normal">~5 minutes</Badge>
          <Badge tone="neutral">Requires iPhone + Apple Watch</Badge>
        </div>
      </Card>

      <Card className="!p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-black text-ink dark:text-ink">Diagnosa sinkronisasi</div>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              Diperiksa dari kiriman yang benar-benar sampai ke server, bukan dari tebakan.
            </p>
          </div>
          <button onClick={jalankanDiagnosa} disabled={cek}
            className="shrink-0 rounded-xl bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-ink disabled:opacity-50 dark:bg-white/10 dark:text-white">
            {cek ? 'Memeriksa…' : 'Periksa lagi'}
          </button>
        </div>

        {diag && (
          <>
            <div className="mt-2 text-[11px] text-neutral-500">
              {diag.deliveries} kiriman tercatat
              {diag.lastAt ? ` · terakhir ${new Date(diag.lastAt).toLocaleString('en-GB')}` : ''}
            </div>
            <div className="mt-3 space-y-2">
              {diag.findings.map((f, i) => {
                const nada = f.level === 'error'
                  ? 'border-rose-500/30 bg-rose-500/[0.06]'
                  : f.level === 'warn' ? 'border-amber-500/30 bg-amber-500/[0.06]'
                    : 'border-emerald-500/30 bg-emerald-500/[0.06]'
                const ikon = f.level === 'error' ? '\u2716' : f.level === 'warn' ? '\u26a0' : '\u2713'
                return (
                  <div key={i} className={`rounded-xl border p-3 ${nada}`}>
                    <div className="text-[13px] font-bold text-ink dark:text-ink">{ikon} {f.judul}</div>
                    <p className="mt-1 text-[12px] leading-relaxed text-neutral-600 dark:text-neutral-300">{f.detail}</p>
                    {f.setelan && (
                      <div className="mt-2 rounded-lg bg-black/5 px-2.5 py-2 text-[12px] dark:bg-white/10">
                        <div className="text-neutral-500">Setelan di Health Auto Export</div>
                        <div className="font-black text-ink dark:text-ink">{f.setelan}</div>
                        <div className="mt-0.5 text-neutral-600 dark:text-neutral-300">Ubah ke: <b>{f.ubahKe}</b></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
        {!diag && !cek && (
          <p className="mt-3 text-[12px] text-neutral-500">Diagnosa belum bisa diambil. Pastikan Anda sudah masuk.</p>
        )}
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {STEPS.map((s, i) => (
          <Card key={i} className="!p-4">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-dark">
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-ink">{s.title}</div>
                <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">{s.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* The density options — deliberately separate from the numbered steps so
          they cannot be skimmed past as just another checkbox. */}
      <Card className="!p-5">
        <SectionTitle
          icon={<IconGauge size={20} />}
          title="Tiga pilihan yang menentukan kerapatan data"
          subtitle="Lebih menentukan daripada seluruh langkah lain digabungkan — dan dua di antaranya bawaannya justru keliru"
        />
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">
          Steps 1–6 decide <b>whether</b> data arrives. These decide <b>how much</b>. Without them you can
          sync faithfully for months and still receive one heart-rate number per hour.
        </p>
        <div className="mt-3 space-y-3">
          {DENSITY.map((d) => (
            <div key={d.name} className="rounded-xl border border-neutral-100 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-ink">{d.name}</span>
                <span className="rounded-lg bg-brand-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-brand-dark">
                  Set to {d.set}
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-neutral-500">
                <span className="font-bold text-neutral-600">Where: </span>{d.where}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">
                <span className="font-bold">Why: </span>{d.why}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-rose-700">
                <span className="font-bold">If left wrong: </span>{d.ifWrong}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-500">
          After changing them, press Export once manually, then open{' '}
          <Link to="/log-detak-jantung" className="font-bold text-brand-dark underline">Heart Rate Log</Link>.
          That page measures the real spacing between your samples and states it, so you can confirm the change
          took effect instead of guessing.
        </p>
      </Card>

      {/* Live link preview, if logged in with backend enabled */}
      {backendEnabled && (
        <Card className="!p-5">
          <SectionTitle icon={<IconKey size={20} />} title="Tautan Sinkron Pribadi Anda" subtitle="For step 2 — copy it into the app" />
          <div className="mt-2 rounded-xl bg-neutral-50 p-3 font-mono text-[11px] text-neutral-600 break-all">
            {url ?? 'Loading…'}
          </div>
          <Link to="/health-data">
            <Button className="mt-3 w-full">Open the Health Data Page <IconChevronRight size={16} /></Button>
          </Link>
        </Card>
      )}

      {/* Privacy note */}
      <Card className="!p-5 !bg-brand-50/60 !border-brand/20">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <IconShield size={18} />
          </div>
          <p className="text-[12px] leading-relaxed text-brand-dark">
            <b>Privacy:</b> your sync link is unique and can only <i>write</i> data to your own account — it can't be used to read anyone's data. The server only stores six summary numbers, not your raw HealthKit history. Link leaked? Regenerate it anytime on the Health Data page.
          </p>
        </div>
      </Card>

      {/* FAQ */}
      <Card className="!p-5">
        <SectionTitle icon={<IconActivity size={20} />} title="Frequently Asked Questions" subtitle="Quick troubleshooting" />
        <div className="mt-2 divide-y divide-neutral-100">
          {FAQ.map((f, i) => (
            <details key={i} className="group py-3">
              <summary className="cursor-pointer list-none text-sm font-bold text-ink marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {f.q}
                  <IconChevronRight size={16} className="shrink-0 text-neutral-500 transition group-open:rotate-90" />
                </span>
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>
      </Card>

      <div className="text-center">
        <Link to="/health-data" className="text-xs font-semibold text-brand-dark hover:underline">
          ← Back to Health Data
        </Link>
      </div>
    </div>
  )
}

export default HealthSyncTutorial
