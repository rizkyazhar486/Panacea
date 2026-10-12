// Penjaga masukan untuk alat endurance: teks kolom -> angka yang sah atau alasan penolakan.
// Murni: tanpa DOM/jaringan. Kolom kosong, bukan angka, atau di luar rentang fisik TIDAK diganti nilai bawaan:
// hasilnya `ok: false` dengan alasan, sehingga halaman menampilkan pesan, bukan rencana dari angka karangan.
// Rentang di sini adalah batas kewajaran masukan, bukan rentang acuan klinis atau target latihan.

export type Reading<T> = { ok: true; value: T } | { ok: false; reason: string }

const fail = (reason: string): { ok: false; reason: string } => ({ ok: false, reason })

/** Teks kolom -> angka. Kosong atau spasi menjadi NaN (bukan 0), sehingga "belum diisi" tidak terbaca sebagai nilai sah. */
export function parseNumberText(text: unknown): number {
  if (typeof text !== 'string' || text.trim() === '') return Number.NaN
  return Number(text)
}

function bounded(text: string, label: string, min: number, max: number, unit: string, opts: { integer?: boolean; minExclusive?: boolean } = {}): Reading<number> {
  const subject = `${label[0]!.toUpperCase()}${label.slice(1)}`
  if (text.trim() === '') return fail(`Enter ${label}.`)
  const value = parseNumberText(text)
  if (!Number.isFinite(value)) return fail(`${subject} must be a number.`)
  if (opts.integer && !Number.isInteger(value)) return fail(`${subject} must be a whole number.`)
  if (opts.minExclusive ? !(value > min && value <= max) : !(value >= min && value <= max)) {
    return fail(opts.minExclusive ? `${subject} must be above ${min} and at most ${max} ${unit}.` : `${subject} must be from ${min} to ${max} ${unit}.`)
  }
  return { ok: true, value }
}

export function readFuelDuration(minutes: string): Reading<number> {
  return bounded(minutes, 'the session duration', 0, 2880, 'minutes', { minExclusive: true })
}

/** Suhu opsional: kosong berarti "tidak diketahui" (bukan 0 °C); isi yang tidak sah ditolak. */
export function readOptionalTemperature(text: string): Reading<number | undefined> {
  if (text.trim() === '') return { ok: true, value: undefined }
  return bounded(text, 'the temperature', -50, 60, '°C')
}

export interface PowerGuideInputs { ftpWatt: number; totalMassKg: number; durationHours: number }

export function readPowerGuideInputs(input: { ftp: string; mass: string; hours: string }): Reading<PowerGuideInputs> {
  const ftp = bounded(input.ftp, 'your FTP', 50, 2000, 'W')
  if (!ftp.ok) return ftp
  const mass = bounded(input.mass, 'the total weight', 20, 300, 'kg')
  if (!mass.ok) return mass
  const hours = bounded(input.hours, 'the estimated hours', 0, 48, 'hours', { minExclusive: true })
  if (!hours.ok) return hours
  return { ok: true, value: { ftpWatt: ftp.value, totalMassKg: mass.value, durationHours: hours.value } }
}

export interface SegmentDraft { nama: string; jarak: string; gradien: string }
export interface SegmentValue { nama: string; jarakKm: number; gradienPct: number }

export function readSegments(drafts: readonly SegmentDraft[]): Reading<SegmentValue[]> {
  if (drafts.length === 0) return fail('Add at least one route segment.')
  const out: SegmentValue[] = []
  for (let i = 0; i < drafts.length; i += 1) {
    const d = drafts[i]!
    const name = `segment ${i + 1}`
    const km = bounded(d.jarak, `the distance of ${name}`, 0, 1000, 'km', { minExclusive: true })
    if (!km.ok) return km
    const grade = bounded(d.gradien, `the gradient of ${name}`, -40, 40, '%')
    if (!grade.ok) return grade
    out.push({ nama: d.nama, jarakKm: km.value, gradienPct: grade.value })
  }
  return { ok: true, value: out }
}

export interface HeatExposureValue { suhuC: number; menit: number }
export interface AltitudeExposureValue { meter: number; jam: number }

export function readHeatExposure(temperature: string, minutes: string): Reading<HeatExposureValue> {
  const t = bounded(temperature, 'the temperature', -50, 60, '°C')
  if (!t.ok) return t
  const m = bounded(minutes, 'the minutes', 0, 1440, 'minutes', { integer: true, minExclusive: true })
  if (!m.ok) return m
  return { ok: true, value: { suhuC: t.value, menit: m.value } }
}

export function readAltitudeExposure(meters: string, hours: string): Reading<AltitudeExposureValue> {
  const a = bounded(meters, 'the altitude', 0, 9000, 'm', { integer: true })
  if (!a.ok) return a
  const h = bounded(hours, 'the hours spent there', 0, 24, 'hours', { minExclusive: true })
  if (!h.ok) return h
  return { ok: true, value: { meter: a.value, jam: h.value } }
}

/** Ketinggian saja, untuk pratinjau penurunan kapasitas aerobik; tanpa jam. */
export function readAltitudeMeters(meters: string): Reading<number> {
  return bounded(meters, 'the altitude', 0, 9000, 'm', { integer: true })
}

export function readBodyWeight(text: string): Reading<number> {
  return bounded(text, 'your body weight', 20, 300, 'kg')
}

export interface SweatTestValue { beforeKg: number; afterKg: number; minutes: number; drunkMl: number }

/** Uji keringat: keempat kolom wajib terisi; "0 mL diminum" harus diketik, bukan dianggap dari kolom kosong. */
export function readSweatTest(input: { before: string; after: string; minutes: string; drunk: string }): Reading<SweatTestValue> {
  const before = bounded(input.before, 'the weight before', 20, 300, 'kg')
  if (!before.ok) return before
  const after = bounded(input.after, 'the weight after', 20, 300, 'kg')
  if (!after.ok) return after
  const minutes = bounded(input.minutes, 'the session duration', 0, 2880, 'minutes', { minExclusive: true })
  if (!minutes.ok) return minutes
  const drunk = bounded(input.drunk, 'the total drunk', 0, 20000, 'mL')
  if (!drunk.ok) return drunk
  return { ok: true, value: { beforeKg: before.value, afterKg: after.value, minutes: minutes.value, drunkMl: drunk.value } }
}
