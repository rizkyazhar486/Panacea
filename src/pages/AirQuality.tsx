import { useEffect, useState } from 'react'
import { Card, SectionTitle, Badge } from '../components/ui'
import { IconActivity, IconHeart } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Air Quality & Respiratory Risk — GPS air quality from the free Open-Meteo
// Air-Quality API (no key, same source family as the weather widget), turned
// into a personal recommendation for people with asthma / COPD / allergies.
// Maps to the "air-quality × asthma predictor" feature. Location is used only to
// fetch AQI; sensitivity profile is stored locally.
// ─────────────────────────────────────────────────────────────────────────────

interface AQ { usAqi: number; pm25: number; pm10: number; ozone: number }
type Status = 'idle' | 'loading' | 'ok' | 'denied' | 'error'

const SENS_KEY = 'pmd_air_sensitivity_v1'

// US AQI category bands.
function aqiBand(aqi: number): { label: string; color: string; general: string } {
  if (aqi <= 50) return { label: 'Good', color: '#00BF63', general: 'Air quality is healthy — enjoy normal outdoor activity.' }
  if (aqi <= 100) return { label: 'Moderate', color: '#a3b100', general: 'Acceptable; unusually sensitive people may notice mild effects.' }
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', color: '#f59e0b', general: 'General public is fine; sensitive groups should ease heavy outdoor exertion.' }
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444', general: 'Everyone may feel effects; sensitive groups more seriously.' }
  if (aqi <= 300) return { label: 'Very unhealthy', color: '#a855f7', general: 'Health alert — everyone should limit outdoor exertion.' }
  return { label: 'Hazardous', color: '#7f1d1d', general: 'Emergency conditions — stay indoors with air filtration.' }
}

// Personalized advice for a sensitive person (asthma/COPD/allergy).
function sensitiveAdvice(aqi: number): string {
  if (aqi <= 50) return 'Great day for you — no extra precautions needed.'
  if (aqi <= 100) return 'Generally fine. Keep your reliever inhaler handy if you exercise outdoors.'
  if (aqi <= 150) return 'Reduce prolonged or heavy outdoor exertion. Carry your reliever; consider a mask if sensitive to particulates.'
  if (aqi <= 200) return 'Move workouts indoors, keep windows closed, run an air purifier, and pre-medicate as your action plan advises.'
  return 'Stay indoors with filtration. Follow your asthma/COPD action plan and seek care for worsening breathlessness.'
}

export function AirQuality() {
  const [status, setStatus] = useState<Status>('idle')
  const [aq, setAq] = useState<AQ | null>(null)
  const [err, setErr] = useState('')
  const [sensitive, setSensitive] = useState<boolean>(() => { try { return localStorage.getItem(SENS_KEY) === '1' } catch { return false } })

  function setSens(v: boolean) { setSensitive(v); try { localStorage.setItem(SENS_KEY, v ? '1' : '0') } catch { /* ignore */ } }

  function fetchAq(lat: number, lng: number) {
    setStatus('loading')
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm2_5,pm10,ozone`)
      .then((r) => r.json())
      .then((j) => {
        const c = j.current
        if (!c || c.us_aqi == null) { setErr('Air-quality data unavailable for your location right now.'); setStatus('error'); return }
        setAq({ usAqi: Math.round(c.us_aqi), pm25: Math.round(c.pm2_5), pm10: Math.round(c.pm10), ozone: Math.round(c.ozone) })
        setStatus('ok')
      })
      .catch(() => { setErr('Failed to load air quality. Try again later.'); setStatus('error') })
  }

  function locate() {
    setErr('')
    if (!navigator.geolocation) { setErr('GPS is not supported by this browser.'); setStatus('error'); return }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchAq(pos.coords.latitude, pos.coords.longitude),
      () => { setErr('Location permission denied. Enable it to check your local air.'); setStatus('denied') },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 10_000 },
    )
  }

  useEffect(() => { locate() }, [])

  const band = aq ? aqiBand(aq.usAqi) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <Card className="!p-5">
        <SectionTitle
          icon={<IconActivity size={20} />}
          title="Air Quality & Respiratory Risk"
          subtitle="Live local air quality with advice tailored to your lungs"
          right={<button onClick={locate} className="shrink-0 rounded-full border border-brand/30 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-dark active:scale-95">📍 Refresh</button>}
        />

        <label className="mt-3 flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-ink dark:border-white/10 dark:text-white">
          <input type="checkbox" checked={sensitive} onChange={(e) => setSens(e.target.checked)} />
          I have asthma, COPD, or airborne allergies
        </label>

        {status === 'loading' && <p className="mt-4 text-sm text-neutral-400">Getting your local air quality…</p>}
        {(status === 'denied' || status === 'error') && err && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-500/10 dark:text-red-300">{err}</p>
        )}

        {aq && band && (
          <>
            <div className="mt-4 flex items-center gap-5 rounded-2xl p-4" style={{ background: band.color + '18' }}>
              <div className="text-center">
                <div className="text-5xl font-black" style={{ color: band.color }}>{aq.usAqi}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">US AQI</div>
              </div>
              <div>
                <Badge tone={aq.usAqi <= 50 ? 'brand' : aq.usAqi <= 150 ? 'low' : 'critical'}>{band.label}</Badge>
                <p className="mt-1 text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{band.general}</p>
              </div>
            </div>

            {/* Personal advice */}
            <div className={'mt-3 rounded-2xl border p-4 ' + (sensitive ? 'border-brand/30 bg-brand-50 dark:bg-white/5' : 'border-neutral-100 dark:border-white/10')}>
              <div className="text-xs font-black uppercase tracking-wide text-brand-dark">{sensitive ? '🫁 For your lungs' : '💡 General advice'}</div>
              <p className="mt-1 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">{sensitive ? sensitiveAdvice(aq.usAqi) : band.general}</p>
            </div>

            {/* Pollutant breakdown */}
            <div className="mt-3 grid grid-cols-3 gap-3">
              <Pollutant label="PM2.5" value={aq.pm25} unit="µg/m³" note="Fine particles" />
              <Pollutant label="PM10" value={aq.pm10} unit="µg/m³" note="Coarse particles" />
              <Pollutant label="Ozone" value={aq.ozone} unit="µg/m³" note="O₃" />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
              Note: the US AQI headline number and the raw pollutant readings above can look slightly
              inconsistent if you try to back-calculate one from the other by hand. That's expected — the
              AQI uses the EPA's <b>NowCast</b> method (a trend-weighted average of the last several hours),
              while PM2.5/PM10/ozone above are the single current-hour reading. During a rapid pollution
              spike or drop, the two will diverge; both are correct, they just describe different time
              windows of the same air.
            </p>
          </>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        Live data from the free Open-Meteo Air-Quality API, fetched using your device's actual GPS
        coordinates via <code>navigator.geolocation</code> (location is used only to fetch the reading,
        never stored or sent anywhere else). Educational guidance based on US AQI bands — it doesn't
        replace your personal asthma/COPD action plan or medical advice. Seek care for worsening
        breathlessness regardless of the number.
      </div>
    </div>
  )
}

function Pollutant({ label, value, unit, note }: { label: string; value: number; unit: string; note: string }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-3 text-center dark:bg-white/5">
      <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-lg font-black text-ink dark:text-white">{Number.isFinite(value) ? value : '—'}<span className="ml-0.5 text-[9px] font-medium text-neutral-400">{unit}</span></div>
      <div className="text-[9px] text-neutral-400">{note}</div>
    </div>
  )
}

export default AirQuality
