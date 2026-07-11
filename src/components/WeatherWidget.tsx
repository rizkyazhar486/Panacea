import { useEffect, useState } from 'react'
import { IconX } from './icons'
import { Portal } from './Portal'

// GPS-based weather — collapsed to a single icon pill on Beranda; tapping
// expands a simplified week/month view. Uses Open-Meteo (free, no API key)
// so it works the same way the free sports-score integration does.

interface DayForecast {
  date: string
  code: number
  tMax: number
  tMin: number
}

interface WeatherData {
  currentTemp: number
  currentCode: number
  days: DayForecast[]
}

type LocStatus = 'idle' | 'locating' | 'denied' | 'ok'

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤️'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '🌨️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '🌡️'
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Cerah'
  if (code === 1 || code === 2) return 'Cerah Berawan'
  if (code === 3) return 'Berawan'
  if (code === 45 || code === 48) return 'Berkabut'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Gerimis'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Hujan'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Salju'
  if ([95, 96, 99].includes(code)) return 'Badai Petir'
  return 'Tidak diketahui'
}

function dayLabel(iso: string, i: number): string {
  if (i === 0) return 'Hari ini'
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function WeatherWidget() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'week' | 'month'>('week')
  const [status, setStatus] = useState<LocStatus>('idle')
  const [data, setData] = useState<WeatherData | null>(null)
  const [err, setErr] = useState('')

  function fetchWeather(lat: number, lng: number) {
    setStatus('locating')
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=16`
    )
      .then((r) => r.json())
      .then((json) => {
        const days: DayForecast[] = (json.daily?.time ?? []).map((date: string, i: number) => ({
          date,
          code: json.daily.weather_code[i],
          tMax: Math.round(json.daily.temperature_2m_max[i]),
          tMin: Math.round(json.daily.temperature_2m_min[i]),
        }))
        setData({
          currentTemp: Math.round(json.current?.temperature_2m ?? days[0]?.tMax ?? 0),
          currentCode: json.current?.weather_code ?? days[0]?.code ?? 0,
          days,
        })
        setStatus('ok')
      })
      .catch(() => { setErr('Gagal memuat cuaca. Coba lagi nanti.'); setStatus('denied') })
  }

  function requestLocation() {
    setErr('')
    if (!navigator.geolocation) { setErr('GPS tidak didukung browser.'); setStatus('denied'); return }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => { setErr('Izin lokasi ditolak. Ketuk untuk coba lagi.'); setStatus('denied') },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 10_000 }
    )
  }

  useEffect(() => { requestLocation() }, [])

  const weekDays = data?.days.slice(0, 7) ?? []
  const monthDays = data?.days ?? []

  return (
    <>
      <button
        onClick={() => (status === 'denied' ? requestLocation() : setOpen(true))}
        aria-label="Cuaca berdasarkan lokasi Anda"
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 shadow-sm transition active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200"
      >
        {status === 'locating' && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-neutral-300 border-t-brand" />}
        {status === 'denied' && <span>📍❓</span>}
        {status === 'ok' && data && (
          <>
            <span className="text-base leading-none">{weatherEmoji(data.currentCode)}</span>
            <span>{data.currentTemp}°</span>
          </>
        )}
      </button>

      {open && (
        <Portal>
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl dark:bg-[#17191c]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-ink dark:text-white">Cuaca Lokasi Anda</h3>
              <button onClick={() => setOpen(false)} aria-label="Tutup" className="grid h-8 w-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10">
                <IconX size={18} />
              </button>
            </div>

            {err && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{err}</p>}

            {data && (
              <div className="mb-4 flex items-center gap-4 rounded-2xl bg-brand-50 p-4 dark:bg-white/5">
                <span className="text-4xl leading-none">{weatherEmoji(data.currentCode)}</span>
                <div>
                  <p className="text-2xl font-black text-ink dark:text-white">{data.currentTemp}°C</p>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-300">{weatherLabel(data.currentCode)}</p>
                </div>
              </div>
            )}

            <div className="mb-3 flex gap-2">
              <button
                onClick={() => setTab('week')}
                className={`flex-1 rounded-full py-2 text-xs font-bold transition ${tab === 'week' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-300'}`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => setTab('month')}
                className={`flex-1 rounded-full py-2 text-xs font-bold transition ${tab === 'month' ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-300'}`}
              >
                Bulan Ini
              </button>
            </div>

            <div className="space-y-1.5">
              {(tab === 'week' ? weekDays : monthDays).map((d, i) => (
                <div key={d.date} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-neutral-50 dark:hover:bg-white/5">
                  <span className="w-28 shrink-0 text-xs font-bold text-ink dark:text-white">{dayLabel(d.date, i)}</span>
                  <span className="text-lg">{weatherEmoji(d.code)}</span>
                  <span className="text-xs text-neutral-400">{weatherLabel(d.code)}</span>
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-200">{d.tMax}° / {d.tMin}°</span>
                </div>
              ))}
            </div>

            {tab === 'month' && (
              <p className="mt-3 text-center text-[10px] text-neutral-400">
                Perkiraan tersedia hingga 16 hari ke depan (batas layanan cuaca gratis).
              </p>
            )}
          </div>
        </div>
        </Portal>
      )}
    </>
  )
}

export default WeatherWidget
