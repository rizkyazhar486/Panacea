// ─────────────────────────────────────────────────────────────────────────────
// Alerts driven by device data: heart-rate zone entry and a bedtime reminder.
//
// Why these did not exist before: the app had notification TOGGLES and a
// working push pipeline, but for these two categories nothing ever produced a
// message. A toggle with no producer behind it looks identical to a broken
// notification system from the user's side, which is exactly how it was
// reported.
//
// What is honest about the timing, and stated in the UI too: data reaches the
// server through the Health Auto Export automation, which runs on a
// minutes-scale interval. So a zone alert arrives MINUTES after the zone was
// entered, not at the moment it happens. That makes it useful for "that easy
// run was not easy" and useless as a live warning during a sprint. Anything
// truly live would need a native app holding a Bluetooth connection.
// ─────────────────────────────────────────────────────────────────────────────

import { getSettings, saveSettings, getSleepSessions } from './store.js'
import { notify } from './push.js'

export interface ZoneDef {
  zone: 1 | 2 | 3 | 4 | 5
  name: string
  /** Lower bound as a fraction of HRmax. */
  from: number
  to: number
  meaning: string
}

export const ZONES: ZoneDef[] = [
  { zone: 1, name: 'Pemulihan', from: 0, to: 0.6, meaning: 'Sangat ringan — untuk pemulihan aktif.' },
  { zone: 2, name: 'Aerobik dasar', from: 0.6, to: 0.7, meaning: 'Inilah zona yang membangun basis daya tahan. Masih bisa bicara kalimat penuh.' },
  { zone: 3, name: 'Tempo', from: 0.7, to: 0.8, meaning: 'Sedang-berat. Hanya bisa bicara beberapa kata.' },
  { zone: 4, name: 'Ambang laktat', from: 0.8, to: 0.9, meaning: 'Berat. Hanya boleh untuk sesi terjadwal, bukan untuk lari mudah.' },
  { zone: 5, name: 'Maksimal', from: 0.9, to: 99, meaning: 'Maksimal. Hanya untuk interval pendek.' },
]

export function zoneFor(bpm: number, hrMax: number): ZoneDef {
  if (!(hrMax > 0)) return ZONES[0]
  const pct = bpm / hrMax
  // Walk from the top so the open-ended zone 5 catches anything above 90%.
  for (let i = ZONES.length - 1; i >= 0; i--) if (pct >= ZONES[i].from) return ZONES[i]
  return ZONES[0]
}

/** 220−age is a population average, so a rate actually observed beats it. */
export function resolveHrMax(prefs: Record<string, any>, observedMax = 0): number {
  const manual = Number(prefs.hrMaxManual)
  if (Number.isFinite(manual) && manual > 100) return manual
  const age = Number(prefs.age)
  const formula = Number.isFinite(age) && age > 0 ? 220 - age : 190
  return Math.max(observedMax, formula)
}

/** Minimum gap between two zone alerts, so a 5-minute sync cannot spam. */
const ZONE_COOLDOWN_MS = 20 * 60_000

export interface ZoneAlertResult {
  sent: boolean
  reason: string
  zone?: number
  bpm?: number
}

/**
 * Fires when the newest sample sits at or above the user's chosen zone.
 *
 * Deliberately driven by the NEWEST sample only. Scanning the whole batch would
 * re-alert on history every time an overlapping window is resent, and the user
 * would be told about a zone they left half an hour ago.
 */
export async function checkHrZoneAlert(
  userId: string,
  samples: { t: number; bpm: number; kind: string }[],
): Promise<ZoneAlertResult> {
  const prefs = getSettings(userId)
  if (prefs.notifHrZone !== true) return { sent: false, reason: 'off' }
  if (!samples.length) return { sent: false, reason: 'no-samples' }

  const threshold = Math.min(5, Math.max(2, Number(prefs.hrZoneThreshold) || 4)) as 2 | 3 | 4 | 5

  // Resting and walking-average readings are daily summaries, not moments in
  // time — alerting on them would be meaningless.
  const usable = samples.filter((s) => s.kind === 'workout' || s.kind === 'heart_rate')
  if (!usable.length) return { sent: false, reason: 'no-usable-samples' }

  const newest = usable.reduce((a, b) => (b.t > a.t ? b : a))

  // Ignore anything older than an hour: a backfill of last week's data must not
  // produce an alert that reads as if it were happening now.
  if (Date.now() - newest.t > 3600_000) return { sent: false, reason: 'stale' }

  const observedMax = samples.reduce((a, s) => Math.max(a, s.bpm), 0)
  const hrMax = resolveHrMax(prefs, observedMax)
  const z = zoneFor(newest.bpm, hrMax)
  if (z.zone < threshold) return { sent: false, reason: 'below-threshold', zone: z.zone, bpm: newest.bpm }

  const last = Number(prefs.hrZoneLastAlertAt) || 0
  if (Date.now() - last < ZONE_COOLDOWN_MS) return { sent: false, reason: 'cooldown', zone: z.zone, bpm: newest.bpm }

  saveSettings(userId, { hrZoneLastAlertAt: Date.now() })
  await notify(userId, {
    title: `❤️ Zona ${z.zone} — ${z.name} · ${newest.bpm} bpm`,
    body: `${z.meaning} Terbaca ${menitLalu(newest.t)}; data sampai di sini beberapa menit setelah terekam.`,
    url: './#/log-detak-jantung',
    tag: 'hr-zone',
  }, 'notifHrZone').catch(() => {})

  return { sent: true, reason: 'sent', zone: z.zone, bpm: newest.bpm }
}

function menitLalu(t: number): string {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000))
  return m < 1 ? 'kurang dari semenit lalu' : `${m} menit lalu`
}

// ── Bedtime reminder ────────────────────────────────────────────────────────

/**
 * A once-a-night nudge, fired `leadMin` before the target bedtime.
 *
 * The target can be set by hand or derived from the device: the median bedtime
 * of recent nights. Median rather than mean because one all-nighter would drag
 * a mean into the small hours and quietly move the reminder with it.
 */
export function suggestedBedtime(email: string): string | null {
  const nights = getSleepSessions(email)
  const mins: number[] = []
  for (const n of nights.slice(-21)) {
    if (!n?.start) continue
    const d = new Date(n.start)
    if (Number.isNaN(d.getTime())) continue
    // Fold into a "night minute" axis running 18:00 → 06:00 so times either
    // side of midnight sort together instead of at opposite ends.
    let m = d.getHours() * 60 + d.getMinutes()
    if (m < 12 * 60) m += 24 * 60
    mins.push(m)
  }
  if (mins.length < 3) return null
  mins.sort((a, b) => a - b)
  const med = mins[Math.floor(mins.length / 2)] % (24 * 60)
  return `${String(Math.floor(med / 60)).padStart(2, '0')}:${String(med % 60).padStart(2, '0')}`
}

/** Local wall-clock minutes for a user, using their stored UTC offset. */
function localMinutesNow(prefs: Record<string, any>): number {
  // Offset in minutes EAST of UTC (Jakarta = +420). Stored by the client, since
  // the server has no idea where the user is.
  const off = Number(prefs.tzOffsetMin)
  const offset = Number.isFinite(off) ? off : 0
  const utcMin = new Date().getUTCHours() * 60 + new Date().getUTCMinutes()
  return ((utcMin + offset) % 1440 + 1440) % 1440
}

function parseHHMM(s: unknown): number | null {
  if (typeof s !== 'string') return null
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1]); const mi = Number(m[2])
  if (h > 23 || mi > 59) return null
  return h * 60 + mi
}

export interface BedtimeCheck { sent: boolean; reason: string }

/**
 * Called once a minute. Fires within a 2-minute window of the target so a
 * momentary hiccup in the loop does not skip the whole night, while the
 * once-per-day stamp prevents a double send.
 */
export async function checkBedtimeReminder(userId: string, email: string): Promise<BedtimeCheck> {
  const prefs = getSettings(userId)
  if (prefs.notifSleepTime !== true) return { sent: false, reason: 'off' }

  const target = parseHHMM(prefs.sleepTargetHHMM) ?? parseHHMM(suggestedBedtime(email))
  if (target == null) return { sent: false, reason: 'no-target' }

  const lead = Math.min(120, Math.max(0, Number(prefs.sleepLeadMin) || 30))
  const fireAt = ((target - lead) % 1440 + 1440) % 1440
  const now = localMinutesNow(prefs)

  const diff = Math.min(Math.abs(now - fireAt), 1440 - Math.abs(now - fireAt))
  if (diff > 2) return { sent: false, reason: 'not-time' }

  // One per calendar day, keyed on the user's own local date.
  const localDate = new Date(Date.now() + (Number(prefs.tzOffsetMin) || 0) * 60_000).toISOString().slice(0, 10)
  if (prefs.sleepLastFiredOn === localDate) return { sent: false, reason: 'already-today' }

  saveSettings(userId, { sleepLastFiredOn: localDate })
  const jam = `${String(Math.floor(target / 60)).padStart(2, '0')}.${String(target % 60).padStart(2, '0')}`
  await notify(userId, {
    title: '🌙 Waktunya bersiap tidur',
    body: lead > 0
      ? `Sasaran tidur Anda pukul ${jam} — ${lead} menit lagi. Yang paling menentukan bukan lamanya, melainkan jam yang tetap sama tiap malam.`
      : `Sasaran tidur Anda pukul ${jam}. Yang paling menentukan bukan lamanya, melainkan jam yang tetap sama tiap malam.`,
    url: './#/pola-tidur',
    tag: 'bedtime',
  }, 'notifSleepTime').catch(() => {})

  return { sent: true, reason: 'sent' }
}
