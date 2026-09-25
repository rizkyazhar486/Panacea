import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Prosa } from '../components/Prosa'
import { getVitals, vitalsAge, type Vitals } from '../lib/healthVitals'
import { getPhoneHealthScanSnapshot, phoneReadingAge, type PhoneHealthScanSnapshot } from '../lib/phoneHealthScan'

type PhotoSlot = 'front' | 'profile'

type CaptureQuality = {
  exposure: 'dark' | 'balanced' | 'bright'
  contrast: 'low' | 'usable'
}

type PhotoCapture = {
  url: string
  quality: CaptureQuality | null
}

function inspectCapture(url: string): Promise<CaptureQuality> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 96
      canvas.height = 96
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        resolve({ exposure: 'balanced', contrast: 'usable' })
        return
      }

      context.drawImage(image, 0, 0, 96, 96)
      const pixels = context.getImageData(0, 0, 96, 96).data
      let sum = 0
      let sumSquares = 0
      let count = 0

      for (let index = 0; index < pixels.length; index += 4) {
        const luminance = 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]
        sum += luminance
        sumSquares += luminance * luminance
        count += 1
      }

      const mean = count ? sum / count : 128
      const variance = count ? Math.max(0, sumSquares / count - mean * mean) : 0
      const standardDeviation = Math.sqrt(variance)

      resolve({
        exposure: mean < 58 ? 'dark' : mean > 210 ? 'bright' : 'balanced',
        contrast: standardDeviation < 24 ? 'low' : 'usable',
      })
    }
    image.onerror = () => resolve({ exposure: 'balanced', contrast: 'usable' })
    image.src = url
  })
}

function metric(value: number | undefined, unit: string, digits = 0) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—'
  return `${value.toFixed(digits)}${unit}`
}

export function PhoneHealthScan() {
  const navigate = useNavigate()
  const [vitals, setVitals] = useState<Vitals>(() => getVitals())
  const [phone, setPhone] = useState<PhoneHealthScanSnapshot>(() => getPhoneHealthScanSnapshot())
  const [front, setFront] = useState<PhotoCapture | null>(null)
  const [profile, setProfile] = useState<PhotoCapture | null>(null)
  const [activePhoto, setActivePhoto] = useState<PhotoSlot>('front')

  useEffect(() => {
    const refreshVitals = () => setVitals(getVitals())
    const refreshPhone = () => setPhone(getPhoneHealthScanSnapshot())
    window.addEventListener('panacea:health-updated', refreshVitals)
    window.addEventListener('panacea:phone-scan-updated', refreshPhone)
    window.addEventListener('focus', refreshVitals)
    window.addEventListener('focus', refreshPhone)
    return () => {
      window.removeEventListener('panacea:health-updated', refreshVitals)
      window.removeEventListener('panacea:phone-scan-updated', refreshPhone)
      window.removeEventListener('focus', refreshVitals)
      window.removeEventListener('focus', refreshPhone)
    }
  }, [])

  useEffect(() => () => {
    if (front?.url) URL.revokeObjectURL(front.url)
  }, [front?.url])

  useEffect(() => () => {
    if (profile?.url) URL.revokeObjectURL(profile.url)
  }, [profile?.url])

  const latestCapture = activePhoto === 'front' ? front : profile

  const evidence = useMemo(() => {
    const items = [
      { label: 'Pulse', value: phone.pulse ? `${phone.pulse.bpm} bpm` : metric(vitals.heartRate as number | undefined, ' bpm') },
      { label: 'Sleep', value: metric(vitals.sleepH as number | undefined, 'h', 1) },
      { label: 'HRV', value: metric(vitals.hrvMs as number | undefined, ' ms') },
      { label: 'VO₂max', value: metric(vitals.vo2max as number | undefined, '') },
      { label: 'Recovery', value: metric(vitals.recoveryPct as number | undefined, '%') },
    ]
    const available = items.filter((item) => item.value !== '—').length
    return { items, available, total: items.length }
  }, [phone.pulse, vitals])

  async function capture(slot: PhotoSlot, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const url = URL.createObjectURL(file)
    const next: PhotoCapture = { url, quality: null }
    const setter = slot === 'front' ? setFront : setProfile
    setter(next)
    setActivePhoto(slot)

    const quality = await inspectCapture(url)
    setter((current) => current?.url === url ? { ...current, quality } : current)
  }

  const qualityLine = latestCapture?.quality
    ? `${latestCapture.quality.exposure} light · ${latestCapture.quality.contrast} contrast`
    : latestCapture
      ? 'checking capture'
      : 'not captured'

  const pulseAge = phoneReadingAge(phone.pulse)
  const syncedAge = vitalsAge(vitals)

  return (
    <section
      className="dark mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-white/[.08] bg-[#040606] text-white"
      aria-labelledby="phone-health-scan-title"
      data-phone-health-scan="v1"
    >
      <header className="flex items-center justify-between gap-4 border-b border-white/[.08] px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300/80">Device-independent check</div>
          <h2 id="phone-health-scan-title" className="truncate text-lg font-black tracking-[-.03em] sm:text-xl">Your phone becomes the intake surface</h2>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/[.08] px-3 py-1.5 text-[10px] font-black text-emerald-200">No wearable required</span>
      </header>

      <div className="space-y-5 p-3 sm:p-5">
        <div className="overflow-hidden rounded-[24px] border border-white/[.08] bg-black">
          <div className="relative aspect-[4/3] min-h-[280px] bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,.12),transparent_45%),linear-gradient(180deg,#111716,#020303)]">
            {latestCapture ? (
              <img src={latestCapture.url} alt={activePhoto === 'front' ? 'Front capture preview' : 'Profile capture preview'} className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center px-8 text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-white/10 bg-white/[.04] text-3xl">◎</div>
                  <div className="mt-4 text-sm font-black">Capture yourself once</div>
                  <div className="mt-1 text-[10px] font-bold text-white/40">front + profile · processed locally for capture quality</div>
                </div>
              </div>
            )}

            <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
              <div className="flex rounded-full border border-white/10 bg-black/55 p-1 backdrop-blur-xl">
                {(['front', 'profile'] as const).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setActivePhoto(slot)}
                    className={`min-h-9 rounded-full px-3 text-[10px] font-black capitalize transition ${activePhoto === slot ? 'bg-white text-black' : 'text-white/65'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <span className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-[9px] font-bold text-white/55 backdrop-blur-xl">{qualityLine}</span>
            </div>

            <div className="absolute inset-x-3 bottom-3 grid grid-cols-2 gap-2">
              <label className="grid min-h-11 cursor-pointer place-items-center rounded-full bg-white text-[11px] font-black text-black">
                Front photo
                <input className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => void capture('front', event)} />
              </label>
              <label className="grid min-h-11 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/55 text-[11px] font-black text-white backdrop-blur-xl">
                Profile photo
                <input className="sr-only" type="file" accept="image/*" capture="user" onChange={(event) => void capture('profile', event)} />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => navigate('/rppg-heart-rate')}
            className="min-h-[96px] rounded-[22px] border border-white/[.08] bg-white/[.035] p-3 text-left transition hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
          >
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">Camera pulse</div>
            <div className="mt-2 text-xl font-black">{phone.pulse ? phone.pulse.bpm : '20s'}</div>
            <div className="mt-1 truncate text-[9px] font-bold text-white/40">{phone.pulse ? `bpm · ${pulseAge ?? 'saved'}` : 'tap to measure'}</div>
          </button>

          <div className="min-h-[96px] rounded-[22px] border border-white/[.08] bg-white/[.035] p-3">
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">Evidence</div>
            <div className="mt-2 text-xl font-black">{evidence.available}/{evidence.total}</div>
            <div className="mt-1 truncate text-[9px] font-bold text-white/40">availability, not health score</div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/aesthetic')}
            className="min-h-[96px] rounded-[22px] border border-white/[.08] bg-white/[.035] p-3 text-left transition hover:bg-white/[.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/50"
          >
            <div className="text-[9px] font-black uppercase tracking-[.12em] text-white/35">Visual report</div>
            <div className="mt-2 text-xl font-black">{front && profile ? 'Ready' : 'Build'}</div>
            <div className="mt-1 truncate text-[9px] font-bold text-white/40">modifiable vitality context</div>
          </button>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/[.08]">
          {evidence.items.map((item, index) => (
            <div key={item.label} className={`flex min-h-12 items-center justify-between gap-4 px-4 ${index ? 'border-t border-white/[.06]' : ''}`}>
              <span className="text-[11px] font-black text-white/55">{item.label}</span>
              <span className="text-sm font-black">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => navigate('/health-data')} className="min-h-11 rounded-full border border-white/10 px-4 text-[11px] font-black text-white/70 hover:bg-white/[.05]">
            Add / sync health data
          </button>
          <button type="button" onClick={() => navigate('/aesthetic')} className="min-h-11 rounded-full bg-emerald-400 px-4 text-[11px] font-black text-black hover:bg-emerald-300">
            Open personalized visual report
          </button>
        </div>

        <details className="rounded-[20px] border border-white/[.08] bg-white/[.025]">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 text-[11px] font-black text-white/60">
            <span>How this works</span>
            <span className="text-[9px] font-bold text-white/30">{syncedAge ? `health data · ${syncedAge}` : 'local-first'}</span>
          </summary>
          <div className="space-y-2 border-t border-white/[.06] px-4 py-3 text-[11px] leading-relaxed text-white/45">
            <Prosa kelas="text-[11px] leading-relaxed text-white/45">Photos stay in this browser session and are used here only for framing, brightness and contrast checks. This surface does not infer attractiveness, masculinity, diagnosis or disease from a face.</Prosa>
            <Prosa kelas="text-[11px] leading-relaxed text-white/45">The camera-pulse tool uses experimental remote photoplethysmography. Sleep, HRV, recovery and fitness remain separate evidence and are shown only when you enter or sync them; Panacea does not fabricate WHOOP-like metrics from a phone camera.</Prosa>
            <Prosa kelas="text-[11px] leading-relaxed text-white/45">Evidence coverage means data availability only. It is not a health-quality score and it does not replace a clinician or a medical device.</Prosa>
          </div>
        </details>
      </div>
    </section>
  )
}

export default PhoneHealthScan
