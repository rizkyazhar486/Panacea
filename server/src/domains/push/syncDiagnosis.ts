// Delivery log -> named, actionable findings for the Apple Health (Health Auto Export) sync.
//
// Pure and deterministic: the clock (`nowMs`) and the user's UTC offset are parameters, so the rules
// can be tested at exact boundaries. Each rule names a specific Health Auto Export setting, so the
// answer is "change X", not "something is wrong".
//
// Two rules were wrong or missing when this lived in store.ts:
// - A sync that had STOPPED was reported as healthy. The log only holds deliveries that arrived, so an
//   automation iOS quit running looked exactly like one that ran yesterday. "Not current" is the
//   failure people actually see; it now has its own finding.
// - "Today's data is never included" compared the phone-local sample date with today's UTC date. For a
//   WIB (+07:00) user, from 00:00 to 07:00 the UTC date is still yesterday, so correct exports were
//   flagged and real misses could pass. Each delivery is now judged against its own arrival date in the
//   user's local time.

export interface WebhookDelivery {
  at: string
  metricGroups: { name: string; samples: number }[]
  workouts: number
  hrSamples: number
  sleepNights: number
  matched: string[]
  /** Newest sample date in the payload (phone-local), if any. */
  newestSampleDate: string | null
  /**
   * Kiriman yang ditolak SEBELUM sampai ke penangan — badan terlalu besar atau
   * JSON rusak. Tanpa catatan ini kegagalan itu tak terlihat di mana pun:
   * telepon menerima galat, log pengiriman tetap kosong, dan halaman diagnosis
   * justru menjawab "sinkronisasi terlihat sehat".
   */
  rejected?: 'too_large' | 'bad_json'
}

export interface SyncFinding {
  level: 'error' | 'warn' | 'ok'
  judul: string
  detail: string
  setelan?: string
  ubahKe?: string
}

export interface SyncDiagnosis {
  findings: SyncFinding[]
  deliveries: number
  lastAt: string | null
}

/** A sync whose newest delivery is older than this has stopped. Exactly 24 h still counts as running. */
export const SYNC_STALE_MS = 24 * 60 * 60 * 1000

const MENIT_MS = 60_000

/** Local calendar date (YYYY-MM-DD) of an instant for a user `tzMenit` minutes east of UTC; null if unparseable. */
export function tanggalLokal(iso: string, tzMenit: number): string | null {
  const t = Date.parse(iso)
  if (!Number.isFinite(t) || !Number.isFinite(tzMenit)) return null
  return new Date(t + tzMenit * MENIT_MS).toISOString().slice(0, 10)
}

function lamaJam(ms: number): string {
  const jam = Math.floor(ms / 3_600_000)
  return jam >= 48 ? `${Math.floor(jam / 24)} days` : `${jam} hours`
}

export function diagnosaSinkron(d: readonly WebhookDelivery[], nowMs: number, tzMenit: number): SyncDiagnosis {
  const findings: SyncFinding[] = []
  const last = d.length ? d[d.length - 1] : null

  if (!last) {
    findings.push({
      level: 'error',
      judul: 'No delivery has ever arrived',
      detail: 'The server has never received data from this phone. Usually that means the URL in Health Auto Export is wrong, the token was rotated so the old one no longer works, or the automation has never actually run.',
      setelan: 'REST API URL',
      ubahKe: 'Paste the latest Private Sync Link from this page again',
    })
    return { findings, deliveries: 0, lastAt: null }
  }

  // Stopped first: every other rule reads deliveries that DID arrive, so on its own the log cannot tell
  // "ran an hour ago" from "ran last week".
  const lastMs = Date.parse(last.at)
  if (Number.isFinite(lastMs) && nowMs - lastMs > SYNC_STALE_MS) {
    findings.push({
      level: 'error',
      judul: 'Sync has stopped',
      detail: `The newest delivery arrived ${lamaJam(nowMs - lastMs)} ago, so the numbers on this site are not current. The link still works; the phone has stopped sending. iOS pauses background automations when Health Auto Export has not been opened for a while, when Low Power Mode is on, or when the phone stays locked (Apple Health data cannot be read while the phone is locked).`,
      setelan: 'Automation / Background',
      ubahKe: 'Open Health Auto Export, run Manual Export once, and keep Background App Refresh on for it',
    })
  }

  // Recent window — an old misconfiguration that has since been fixed should stop being reported.
  const recent = d.slice(-10)

  // Rejected payloads: while these are happening, every other finding is computed from deliveries that
  // DID land, so the sync looks healthier than it is.
  const ditolak = recent.filter((x) => x.rejected)
  if (ditolak.length) {
    const besar = ditolak.filter((x) => x.rejected === 'too_large').length
    findings.push({
      level: 'error',
      judul: 'Some deliveries were rejected before they could be read',
      detail: besar
        ? `${besar} of the last ${recent.length} deliveries were too large for the server to accept, so nothing in them was saved — including any workout they carried. A single long run exported with per-second heart rate is the usual cause. The phone reports this as a failure, but nothing else in the app would have shown it.`
        : `${ditolak.length} of the last ${recent.length} deliveries could not be read as JSON, so nothing in them was saved.`,
      setelan: 'Export Period',
      ubahKe: 'Narrow it to "Today" so each delivery carries one day rather than several',
    })
  }

  if (recent.every((x) => x.workouts === 0)) {
    findings.push({
      level: 'error',
      judul: 'Workouts are never included',
      detail: `Not one of the last ${recent.length} deliveries carried workout data. This is why a run does not appear in Workout History — it was never sent. The heart-rate series recorded during the workout is lost with it, and that is the densest data the watch can produce.`,
      setelan: 'Include Workouts',
      ubahKe: 'Turn it ON (and leave Workout Types empty so every type is included)',
    })
  }

  // Each delivery against its OWN arrival day in the user's local time (not today's UTC date).
  const bertanggal = recent.filter((x) => x.newestSampleDate && tanggalLokal(x.at, tzMenit))
  if (bertanggal.length >= 3 && bertanggal.every((x) => x.newestSampleDate! < tanggalLokal(x.at, tzMenit)!)) {
    const akhir = bertanggal[bertanggal.length - 1]
    findings.push({
      level: 'error',
      judul: 'Today’s data is never included',
      detail: `Every recent delivery carried only older days: the newest arrived on ${tanggalLokal(akhir.at, tzMenit)} with samples up to ${akhir.newestSampleDate}. The export range does not cover the day it runs, so trends stop at yesterday however many times the sync runs.`,
      setelan: 'Export Period',
      ubahKe: '"Today" (or "Last 7 Days" to backfill the missing days at the same time)',
    })
  }

  if (recent.every((x) => x.hrSamples === 0)) {
    findings.push({
      level: 'warn',
      judul: 'No heart-rate sample has been stored',
      detail: 'Deliveries arrive, but they carry no heart-rate series. Body Battery, Heart Rate Log and Training Physiology all depend on it.',
      setelan: 'Aggregate Data',
      ubahKe: 'Turn it OFF, and make sure the "Heart Rate" metric is ticked',
    })
  }

  const kosong = recent.filter((x) => x.metricGroups.length > 0 && x.metricGroups.every((g) => g.samples === 0))
  if (kosong.length === recent.length && recent.length >= 3) {
    findings.push({
      level: 'warn',
      judul: 'Metrics arrive empty',
      detail: 'The metric names arrive, but every one of them is empty. That is characteristic of a date range containing no data at all.',
      setelan: 'Export Period',
      ubahKe: '"Last 7 Days"',
    })
  }

  // A payload that arrives and produces nothing anywhere: the exporter reports success, and the app stays
  // empty with no error on either side.
  const hampa = recent.filter((x) => !x.matched.length && x.hrSamples === 0 && x.sleepNights === 0 && x.workouts === 0)
  if (hampa.length === recent.length && recent.length >= 3) {
    findings.push({
      level: 'warn',
      judul: 'Deliveries arrive but produce nothing',
      detail: 'The server receives deliveries, but nothing in them can be saved. The phone still reports success, so this failure is invisible from either side. Try widening the date range; if it stays like this, send a screenshot of this page.',
      setelan: 'Export Period / Data Type',
      ubahKe: '"Last 7 Days", and make sure the metrics you want are ticked',
    })
  }

  if (!findings.length) {
    findings.push({
      level: 'ok',
      judul: 'Sync looks healthy',
      detail: `${d.length} deliveries recorded; the most recent carried ${last.hrSamples} heart-rate samples and ${last.workouts} workouts.`,
    })
  }
  return { findings, deliveries: d.length, lastAt: last.at }
}
