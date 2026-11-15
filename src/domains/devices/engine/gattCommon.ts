/**
 * Small standard Bluetooth characteristics read once on connect, for provenance and the device card.
 * Every value comes from the device and is untrusted: it is validated here and refused (null) when malformed.
 */

/** Battery Level 0x2A19: one byte, a percentage 0-100. Values above 100 are prohibited by the specification. */
export function parseBatteryLevel(bytes: Uint8Array): number | null {
  if (bytes.length !== 1) return null
  const percent = bytes[0]!
  return percent <= 100 ? percent : null
}

export type SensorLocation = 'other' | 'chest' | 'wrist' | 'finger' | 'hand' | 'ear-lobe' | 'foot'

/** Body Sensor Location 0x2A38: one byte; 0-6 are assigned, 7-255 reserved (unknown, not guessed). */
const LOCATIONS: readonly SensorLocation[] = ['other', 'chest', 'wrist', 'finger', 'hand', 'ear-lobe', 'foot']

export function parseBodySensorLocation(bytes: Uint8Array): SensorLocation | null {
  if (bytes.length !== 1) return null
  return LOCATIONS[bytes[0]!] ?? null
}

/** Longest device text kept: enough for any real manufacturer or model name, short enough for one line. */
export const DEVICE_TEXT_MAX = 64

/**
 * Device Information strings (Manufacturer Name 0x2A29, Model Number 0x2A24) and the advertised device name: UTF-8,
 * often padded with NULs. Control characters are dropped and the result is capped; nothing left means unknown.
 */
export function cleanDeviceText(value: Uint8Array | string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  let text: string
  try {
    text = typeof value === 'string' ? value : new TextDecoder('utf-8', { fatal: true }).decode(value)
  } catch {
    return null
  }
  // eslint-disable-next-line no-control-regex
  const cleaned = text.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim()
  if (!cleaned) return null
  return [...cleaned].slice(0, DEVICE_TEXT_MAX).join('')
}
