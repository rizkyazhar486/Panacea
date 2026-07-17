import { useMemo, useState } from 'react'
import { Card, SectionTitle, Button, Badge, SkeletonRows } from '../components/ui'
import { IconHospital, IconPhone, IconCheck, IconSearch } from '../components/icons'
import { BottomSheet } from '../components/BottomSheet'
import { ButtonGroup } from '../components/Carousel'
import { HOSPITALS, fetchNearbyFacilities, type FacilityKind, type NearbyFacility } from '../lib/hospitals'

const KIND_LABEL: Record<string, string> = { Semua: 'All Facilities', RS: 'Hospital', Klinik: 'Clinic', Apotek: 'Pharmacy' }
const KIND_EMOJI: Record<string, string> = { Semua: '🏥', RS: '🏥', Klinik: '🩺', Apotek: '💊' }

type Coords = { lat: number; lng: number }

// Normalize the built-in demo list to the same shape as live results.
const DEMO: NearbyFacility[] = HOSPITALS.map((h) => ({
  id: h.id, name: h.name, kind: h.kind, type: h.type, city: h.city, phone: h.phone,
  lat: h.lat, lng: h.lng, dist: h.distanceKm, services: h.services, rating: h.rating, emergency: h.emergency,
}))

export function Hospitals() {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [geoState, setGeoState] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle')
  const [kind, setKind] = useState<FacilityKind | 'Semua'>('Semua')
  const [q, setQ] = useState('')
  const [live, setLive] = useState<NearbyFacility[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [liveErr, setLiveErr] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  function useMyLocation() {
    if (!('geolocation' in navigator)) { setGeoState('denied'); return }
    setGeoState('asking')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCoords(c); setGeoState('granted'); loadNearby(c)
      },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function loadNearby(c: Coords) {
    setLoading(true); setLiveErr(false)
    try {
      const f = await fetchNearbyFacilities(c.lat, c.lng)
      setLive(f.length ? f : [])
    } catch {
      setLiveErr(true); setLive(null)
    } finally {
      setLoading(false)
    }
  }

  const source: NearbyFacility[] = live ?? DEMO
  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return source
      .filter((h) => (kind === 'Semua' ? true : h.kind === kind))
      .filter((h) => !query || h.name.toLowerCase().includes(query) || h.city.toLowerCase().includes(query) || h.services.some((s) => s.toLowerCase().includes(query)))
      .sort((a, b) => a.dist - b.dist)
  }, [source, kind, q])

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle
          icon={<IconHospital size={20} />}
          title="Nearest Health Facilities"
          subtitle="Nearby hospitals, clinics & pharmacies — important for emergencies"
          right={<Button variant="outline" onClick={useMyLocation} disabled={geoState === 'asking' || loading}>📍 {geoState === 'asking' || loading ? 'Searching…' : 'Use My Location (GPS)'}</Button>}
        />
        <div className={`rounded-xl px-3 py-2 text-xs ${geoState === 'granted' ? 'bg-brand-50 text-brand-dark' : geoState === 'denied' ? 'bg-red-50 text-accent' : 'bg-neutral-50 text-neutral-500'}`}>
          {geoState === 'granted' && coords && live
            ? `📍 ${live.length} real facilities near you (OpenStreetMap data).`
            : geoState === 'granted' && coords && liveErr
            ? '📍 Location detected, but map data is currently unreachable — showing examples.'
            : geoState === 'asking' ? 'Requesting location permission…'
            : geoState === 'denied' ? 'Location permission denied / unavailable — showing a sample list.'
            : 'Enable GPS to show REAL hospitals & pharmacies near you along with their phone numbers.'}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
          <IconSearch size={16} className="text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / service / city…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        {/* Desktop: Button Group. Mobile: a button that opens a bottom sheet. */}
        <div className="mt-3 hidden sm:block">
          <ButtonGroup
            value={kind}
            options={[{ id: 'Semua', label: 'All' }, { id: 'RS', label: 'Hospital' }, { id: 'Klinik', label: 'Clinic' }, { id: 'Apotek', label: 'Pharmacy' }] as { id: FacilityKind | 'Semua'; label: string }[]}
            onChange={setKind}
          />
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold sm:hidden"
        >
          <span>{KIND_EMOJI[kind]} {KIND_LABEL[kind]}</span>
          <span className="text-brand-dark">Select ▾</span>
        </button>
      </Card>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Select facility type">
        <div className="space-y-2">
          {(['Semua', 'RS', 'Klinik', 'Apotek'] as const).map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); setSheetOpen(false) }}
              className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition ${kind === k ? 'border-brand bg-brand-50 text-brand-dark' : 'border-neutral-200'}`}
            >
              <span>{KIND_EMOJI[k]} {KIND_LABEL[k]}</span>
              {kind === k && <IconCheck size={18} className="text-brand" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {loading && <SkeletonRows rows={4} />}

      <div className="grid gap-4 md:grid-cols-2">
        {!loading && list.map((h) => <FacilityCard key={h.id} h={h} hasCoords={!!coords} />)}
        {!loading && list.length === 0 && <Card className="text-center text-sm text-neutral-400">No matching facilities.</Card>}
      </div>
    </div>
  )
}

function FacilityCard({ h, hasCoords }: { h: NearbyFacility; hasCoords: boolean }) {
  const phoneClean = h.phone.replace(/[^0-9+]/g, '')
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`
  // Gojek/Grab don't expose public ride-deeplinks to a destination; we route via
  // Google Maps (which offers Gojek/Grab/transit options natively on mobile).
  const gojek = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}&travelmode=driving`

  return (
    <Card hover className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold leading-tight">{h.name}</h3>
            {h.emergency && <Badge tone="high">ER / 24h</Badge>}
          </div>
          <p className="text-sm text-neutral-500">{[h.city, h.type].filter(Boolean).join(' · ')}</p>
        </div>
        <Badge tone="brand">{h.dist.toFixed(1)} km</Badge>
      </div>
      {h.services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {h.services.slice(0, 4).map((s) => <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{s}</span>)}
        </div>
      )}
      <div className="mt-3 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
        {h.rating > 0 && <span>★ {h.rating} · </span>}
        {h.phone ? <span>{h.phone}</span> : <span className="text-neutral-400">Phone number not yet available on the map</span>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {h.phone ? (
          <a href={`tel:${phoneClean}`}><Button variant="outline" className="w-full"><IconPhone size={14} /> Call</Button></a>
        ) : (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full"><IconSearch size={14} /> Find Info</Button></a>
        )}
        <a href={mapsUrl} target="_blank" rel="noreferrer"><Button className="w-full"><IconCheck size={14} /> Directions</Button></a>
      </div>
      <a href={gojek} target="_blank" rel="noreferrer" className="mt-2">
        <Button variant="ghost" className="w-full text-brand-dark">🛵 Book a ride here</Button>
      </a>
    </Card>
  )
}
