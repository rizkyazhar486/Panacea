/**
 * Heart Rate Measurement — the Bluetooth SIG standard characteristic 0x2A37 of the Heart Rate service 0x180D.
 *
 * Any band, watch or strap that broadcasts standard Bluetooth heart rate sends this, whoever made it (most chest
 * straps; some wrist bands, often behind a "broadcast heart rate" setting). Layout (GATT Specification Supplement),
 * little-endian:
 *
 *   byte 0     flags   bit 0: heart rate is UINT16 (else UINT8)
 *                      bit 1: sensor contact detected · bit 2: sensor contact supported
 *                      bit 3: Energy Expended present (UINT16, kilojoules)
 *                      bit 4: one or more RR-Intervals present (UINT16 each, in 1/1024 s)
 *                      bits 5-7: reserved for future use (ignored)
 *   then       heart rate (UINT8 or UINT16), Energy Expended if flagged, RR-Intervals to the end if flagged.
 *
 * A packet that does not fit this layout is refused whole (fail closed): a misframed packet could put an RR byte
 * into the heart rate. A heart rate of 0 is no reading — some devices send it while off the skin — never a value.
 */

export type SensorContact = 'detected' | 'not-detected' | 'not-supported'

export interface HeartRateReading {
  readonly bpm: number
  readonly contact: SensorContact
  readonly energyExpendedKj: number | null
  /** Beat-to-beat intervals in milliseconds, converted exactly from the 1/1024 s units on the wire. */
  readonly rrMs: readonly number[]
}

export type HeartRateRefusal = 'empty' | 'truncated' | 'odd-rr-bytes' | 'zero-rr' | 'no-heart-rate'

export type HeartRateParse =
  | { readonly ok: true; readonly reading: HeartRateReading }
  | { readonly ok: false; readonly reason: HeartRateRefusal }

const FLAG_UINT16 = 0x01
const FLAG_CONTACT_DETECTED = 0x02
const FLAG_CONTACT_SUPPORTED = 0x04
const FLAG_ENERGY = 0x08
const FLAG_RR = 0x10

/** RR-Interval resolution on the wire: 1/1024 second. */
const RR_UNITS_PER_SECOND = 1024

const uint16 = (bytes: Uint8Array, at: number) => bytes[at]! | (bytes[at + 1]! << 8)

export function parseHeartRateMeasurement(bytes: Uint8Array): HeartRateParse {
  if (bytes.length === 0) return { ok: false, reason: 'empty' }
  const flags = bytes[0]!
  const wide = (flags & FLAG_UINT16) !== 0
  let at = 1
  if (bytes.length < at + (wide ? 2 : 1)) return { ok: false, reason: 'truncated' }
  const bpm = wide ? uint16(bytes, at) : bytes[at]!
  at += wide ? 2 : 1

  let energyExpendedKj: number | null = null
  if (flags & FLAG_ENERGY) {
    if (bytes.length < at + 2) return { ok: false, reason: 'truncated' }
    energyExpendedKj = uint16(bytes, at)
    at += 2
  }

  const rrMs: number[] = []
  if (flags & FLAG_RR) {
    if ((bytes.length - at) % 2 !== 0) return { ok: false, reason: 'odd-rr-bytes' }
    for (; at < bytes.length; at += 2) {
      const units = uint16(bytes, at)
      // An interval of zero cannot be a heartbeat: the packet is not trustworthy.
      if (units === 0) return { ok: false, reason: 'zero-rr' }
      rrMs.push((units * 1000) / RR_UNITS_PER_SECOND)
    }
  }

  if (bpm === 0) return { ok: false, reason: 'no-heart-rate' }
  const contact: SensorContact = (flags & FLAG_CONTACT_SUPPORTED) === 0
    ? 'not-supported'
    : (flags & FLAG_CONTACT_DETECTED) !== 0 ? 'detected' : 'not-detected'
  return { ok: true, reading: { bpm, contact, energyExpendedKj, rrMs } }
}
