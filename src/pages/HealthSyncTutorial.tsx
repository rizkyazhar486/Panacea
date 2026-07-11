import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, SectionTitle, Badge, Button } from '../components/ui'
import {
  IconHeart, IconActivity, IconDownload, IconKey, IconShield, IconCheck,
  IconTimer, IconGauge, IconChevronRight,
} from '../components/icons'
import { api, backendEnabled } from '../lib/api'

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
    body: 'Paste the Private Sync Link from step 2 into the URL field. Make sure the export format is set to JSON (not CSV) — the Panaceamed server only reads this format.',
  },
  {
    icon: <IconHeart size={22} />,
    title: '5. Select the metrics to sync',
    body: 'Check: VO2 Max, Resting Heart Rate, Heart Rate Variability, Sleep Analysis, Weight Body Mass, Body Fat Percentage. You may check other metrics too, but only these six are read by Panaceamed for now.',
  },
  {
    icon: <IconTimer size={22} />,
    title: '6. Turn on the automatic schedule',
    body: 'Turn on "Automatically Export" and set a schedule (recommended: every morning). Health Auto Export will send your latest data to Panaceamed without you opening any app.',
  },
  {
    icon: <IconCheck size={22} />,
    title: '7. Run one manual test',
    body: 'Press the "Export" button in the app to send data for the first time. Reopen Health Data in Panaceamed — your VO2max, HRV, and resting HR will fill in automatically within a few seconds.',
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
    a: 'No. The server only extracts six numbers (VO2max, resting HR, HRV, sleep, weight, body fat) from what the app sends, then discards the rest. No raw HealthKit file is stored.',
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

      {/* Live link preview, if logged in with backend enabled */}
      {backendEnabled && (
        <Card className="!p-5">
          <SectionTitle icon={<IconKey size={20} />} title="Your Private Sync Link" subtitle="For step 2 — copy it into the app" />
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
                  <IconChevronRight size={16} className="shrink-0 text-neutral-400 transition group-open:rotate-90" />
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
