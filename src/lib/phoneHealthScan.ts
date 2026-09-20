export interface PhonePulseReading {
  bpm: number
  measuredAt: string
  method: 'camera-rppg-experimental'
}

export interface PhoneHealthScanSnapshot {
  pulse?: PhonePulseReading
}

const KEY = 'pmd_phone_health_scan_v1'

export function getPhoneHealthScanSnapshot(): PhoneHealthScanSnapshot {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as PhoneHealthScanSnapshot
    const pulse = parsed?.pulse
    if (
      pulse
      && Number.isFinite(pulse.bpm)
      && pulse.bpm >= 30
      && pulse.bpm <= 240
      && typeof pulse.measuredAt === 'string'
      && pulse.method === 'camera-rppg-experimental'
    ) {
      return { pulse }
    }
  } catch {
    // Phone-only checks remain optional when storage is unavailable.
  }
  return {}
}

export function savePhonePulse(bpm: number): PhonePulseReading | null {
  if (!Number.isFinite(bpm) || bpm < 30 || bpm > 240) return null

  const pulse: PhonePulseReading = {
    bpm: Math.round(bpm),
    measuredAt: new Date().toISOString(),
    method: 'camera-rppg-experimental',
  }

  try {
    const current = getPhoneHealthScanSnapshot()
    localStorage.setItem(KEY, JSON.stringify({ ...current, pulse }))
    window.dispatchEvent(new CustomEvent('panacea:phone-scan-updated', { detail: pulse }))
  } catch {
    // The measured result still remains visible in the active rPPG session.
  }

  return pulse
}

export function phoneReadingAge(reading?: { measuredAt?: string }): string | null {
  if (!reading?.measuredAt) return null
  const timestamp = Date.parse(reading.measuredAt)
  if (Number.isNaN(timestamp)) return null

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (seconds < 60) return 'now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}
