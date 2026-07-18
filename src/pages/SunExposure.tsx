import { useEffect, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconSun } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Sun Exposure & Vitamin D Calculator — live UV index (GPS, free Open-Meteo
// API, no key) combined with standard photobiology to estimate time-to-
// sunburn by skin type and a rough vitamin D synthesis window. Not a black
// box: derived from two published, checkable facts —
//   1. WMO UV Index definition: UVI = 40 × Ieff, where Ieff is the erythemally
//      weighted irradiance in W/m². So Ieff (W/m²) = UVI / 40.
//   2. Standard Minimal Erythema Dose (MED) reference values by Fitzpatrick
//      skin type (commonly cited in dermatology/photobiology, e.g. Diffey):
//      Type I ~200 J/m², II ~250, III ~300, IV ~450, V ~600, VI ~1000.
// Time-to-MED (minutes) = MED / Ieff / 60 = (2/3) × MED / UVI.
// Vitamin D synthesis guidance follows the widely-taught rule (Holick,
// "Vitamin D Deficiency", NEJM 2007): roughly 25-33% of time-to-burn, with
// ~25% of skin exposed (e.g. arms + legs, or arms + face + hands), a few
// times a week — NOT a precise personal dose, and synthesis is negligible
// when UV index is below ~3 (too little UVB reaches the ground).
// ─────────────────────────────────────────────────────────────────────────────

interface SkinType { id: number; label: string; med: number; desc: string }
const SKIN_TYPES: SkinType[] = [
  { id: 1, label: 'Type I', med: 200, desc: 'Very fair, always burns, never tans (pale, freckles, red/blonde hair)' },
  { id: 2, label: 'Type II', med: 250, desc: 'Fair, usually burns, tans minimally' },
  { id: 3, label: 'Type III', med: 300, desc: 'Medium, sometimes burns, tans gradually' },
  { id: 4, label: 'Type IV', med: 450, desc: 'Olive/light brown, rarely burns, tans easily' },
  { id: 5, label: 'Type V', med: 600, desc: 'Brown, very rarely burns, tans darkly' },
  { id: 6, label: 'Type VI', med: 1000, desc: 'Deeply pigmented, never burns' },
]

function minutesToBurn(uvIndex: number, medJm2: number): number {
  if (uvIndex <= 0) return Infinity
  const ieff = uvIndex / 40 // W/m²
  return medJm2 / ieff / 60
}

type Status = 'idle' | 'loading' | 'ok' | 'denied' | 'error'

export function SunExposure() {
  const [status, setStatus] = useState<Status>('idle')
  const [uvIndex, setUvIndex] = useState<number | null>(null)
  const [err, setErr] = useState('')
  const [skinId, setSkinId] = useState(3)

  function fetchUv(lat: number, lng: number) {
    setStatus('loading')
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=uv_index`)
      .then((r) => r.json())
      .then((j) => {
        const uv = j?.current?.uv_index
        if (uv == null) { setErr('UV index unavailable for your location right now.'); setStatus('error'); return }
        setUvIndex(Math.round(uv * 10) / 10)
        setStatus('ok')
      })
      .catch(() => { setErr('Failed to load UV index. Try again later.'); setStatus('error') })
  }

  function locate() {
    setErr('')
    if (!navigator.geolocation) { setErr('GPS is not supported by this browser.'); setStatus('error'); return }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchUv(pos.coords.latitude, pos.coords.longitude),
      () => { setErr('Location permission denied. Enable it to check your local UV index.'); setStatus('denied') },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 10_000 },
    )
  }

  useEffect(() => { locate() }, [])

  const skin = SKIN_TYPES.find((s) => s.id === skinId)!
  const burnMin = uvIndex != null ? minutesToBurn(uvIndex, skin.med) : null
  const vitDMin = burnMin != null && Number.isFinite(burnMin) ? burnMin * 0.3 : null
  const uvBand = uvIndex == null ? null
    : uvIndex < 3 ? { label: 'Low', color: '#00BF63' }
    : uvIndex < 6 ? { label: 'Moderate', color: '#a3b100' }
    : uvIndex < 8 ? { label: 'High', color: '#f59e0b' }
    : uvIndex < 11 ? { label: 'Very High', color: '#ef4444' }
    : { label: 'Extreme', color: '#a855f7' }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconSun size={20} />}
          title="Sun Exposure & Vitamin D"
          subtitle="Live local UV index, sunburn timing & a rough vitamin D window"
          right={<button onClick={locate} className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark active:scale-95">📍 Refresh</button>}
        />

        <div className="mt-3">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Your skin type (Fitzpatrick scale)</div>
          <select className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" value={skinId} onChange={(e) => setSkinId(Number(e.target.value))}>
            {SKIN_TYPES.map((s) => <option key={s.id} value={s.id}>{s.label} — {s.desc}</option>)}
          </select>
        </div>

        {status === 'loading' && <p className="mt-4 text-sm text-neutral-400">Getting your local UV index…</p>}
        {(status === 'denied' || status === 'error') && err && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>
        )}

        {uvIndex != null && uvBand && (
          <>
            <div className="mt-4 flex items-center gap-5 rounded-2xl p-4" style={{ background: uvBand.color + '18' }}>
              <div className="text-center">
                <div className="text-5xl font-black" style={{ color: uvBand.color }}>{uvIndex}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">UV Index</div>
              </div>
              <div>
                <Badge tone={uvIndex < 3 ? 'brand' : uvIndex < 8 ? 'low' : 'critical'}>{uvBand.label}</Badge>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {uvIndex < 3 ? 'Low burn risk for most skin types. Minimal vitamin D synthesis at this level.' : 'Meaningful burn risk with unprotected exposure — timing below is for planning, not a guarantee.'}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-white/5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Time to sunburn risk</div>
                <div className="text-lg font-black text-ink dark:text-white">{Number.isFinite(burnMin!) ? `~${burnMin!.toFixed(0)} min` : '—'}</div>
                <div className="text-[9px] text-neutral-400">Unprotected, {skin.label}</div>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-white/5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">Rough vitamin D window</div>
                <div className="text-lg font-black text-ink dark:text-white">{uvIndex >= 3 && vitDMin != null && Number.isFinite(vitDMin) ? `~${vitDMin.toFixed(0)} min` : 'Minimal today'}</div>
                <div className="text-[9px] text-neutral-400">Arms + legs exposed</div>
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
              Derived from the WMO UV Index definition and standard erythema-dose reference values for
              your skin type — not a personalized prescription. Actual time varies with cloud cover,
              altitude, reflective surfaces (snow/sand/water), sunscreen, medications that increase
              photosensitivity, and how much skin is exposed. People with a history of skin cancer,
              photosensitive conditions, or on photosensitizing medication should follow their
              dermatologist's guidance instead of this estimate.
            </p>
          </>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Live UV index from the free Open-Meteo API, fetched using your device's actual GPS coordinates
        (location is used only to fetch the reading). Educational estimate, not medical advice.
      </div>
    </div>
  )
}

export default SunExposure
