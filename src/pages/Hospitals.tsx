import { useMemo, useState } from 'react'
import { useStore, uid } from '../lib/store'
import { Card, SectionTitle, Button, Badge } from '../components/ui'
import { IconHospital, IconPhone, IconCheck, IconSearch } from '../components/icons'
import { HOSPITALS, distanceKm, type FacilityKind } from '../lib/hospitals'

type Coords = { lat: number; lng: number }

export function Hospitals() {
  const { account, sendEmail } = useStore()
  const [scheduled, setScheduled] = useState('')
  const [coords, setCoords] = useState<Coords | null>(null)
  const [geoState, setGeoState] = useState<'idle' | 'asking' | 'granted' | 'denied'>('idle')
  const [kind, setKind] = useState<FacilityKind | 'Semua'>('Semua')
  const [q, setQ] = useState('')

  function useMyLocation() {
    if (!('geolocation' in navigator)) { setGeoState('denied'); return }
    setGeoState('asking')
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoState('granted') },
      () => setGeoState('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const list = useMemo(() => {
    const query = q.trim().toLowerCase()
    return HOSPITALS
      .map((h) => ({ ...h, dist: coords ? distanceKm(coords.lat, coords.lng, h.lat, h.lng) : h.distanceKm }))
      .filter((h) => (kind === 'Semua' ? true : h.kind === kind))
      .filter((h) => !query || h.name.toLowerCase().includes(query) || h.city.toLowerCase().includes(query) || h.services.some((s) => s.toLowerCase().includes(query)))
      .sort((a, b) => a.dist - b.dist)
  }, [coords, kind, q])

  function schedule(name: string) {
    const at = new Date().toISOString()
    sendEmail({ id: uid(), to: account?.email ?? '', subject: `Permintaan penjadwalan tindakan — ${name}`, body: `Permintaan rujukan & penjadwalan ke ${name} diterima. Admin akan menghubungi Anda.`, at })
    setScheduled(name)
    setTimeout(() => setScheduled(''), 3000)
  }

  return (
    <div className="space-y-6">
      {scheduled && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-ink px-4 py-2 text-sm text-white shadow-lg">✓ Permintaan jadwal ke {scheduled} dikirim · cek email</div>
      )}
      <Card>
        <SectionTitle
          icon={<IconHospital size={20} />}
          title="Fasilitas Kesehatan Terdekat"
          subtitle="Rumah sakit, klinik & apotek terdekat — penting untuk situasi darurat"
          right={<Button variant="outline" onClick={useMyLocation}>📍 Gunakan Lokasi Saya (GPS)</Button>}
        />
        <div className={`rounded-xl px-3 py-2 text-xs ${geoState === 'granted' ? 'bg-brand-50 text-brand-dark' : geoState === 'denied' ? 'bg-red-50 text-accent' : 'bg-neutral-50 text-neutral-500'}`}>
          {geoState === 'granted' && coords ? `📍 Lokasi terdeteksi (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}) — jarak dihitung dari posisi Anda.`
            : geoState === 'asking' ? 'Meminta izin lokasi…'
            : geoState === 'denied' ? 'Izin lokasi ditolak / tidak tersedia — memakai estimasi jarak default.'
            : 'Aktifkan GPS agar kami menghitung jarak fasilitas dari posisi Anda saat ini.'}
        </div>

        {/* search + kind filter */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
          <IconSearch size={16} className="text-neutral-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / layanan / kota…" className="w-full bg-transparent text-sm outline-none" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['Semua', 'RS', 'Klinik', 'Apotek'] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${kind === k ? 'bg-brand text-white' : 'bg-neutral-100 text-neutral-500'}`}>
              {k === 'RS' ? 'Rumah Sakit' : k}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((h) => (
          <Card key={h.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold leading-tight">{h.name}</h3>
                  {h.emergency && <Badge tone="high">IGD 24 jam</Badge>}
                </div>
                <p className="text-sm text-neutral-500">{h.city} · {h.type}</p>
              </div>
              <Badge tone="brand">{h.dist.toFixed(1)} km</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {h.services.map((s) => <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">{s}</span>)}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500"><span>★ {h.rating} · {h.phone}</span></div>
            <div className="mt-3 flex gap-2">
              <a href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`} className="flex-1">
                <Button variant="outline" className="w-full"><IconPhone size={14} /> Hubungi</Button>
              </a>
              <a href={coords ? `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`} target="_blank" rel="noreferrer" className="flex-1">
                <Button className="w-full" onClick={() => schedule(h.name)}><IconCheck size={14} /> Rute & Jadwal</Button>
              </a>
            </div>
          </Card>
        ))}
        {list.length === 0 && <Card className="text-center text-sm text-neutral-400">Tidak ada fasilitas yang cocok.</Card>}
      </div>
    </div>
  )
}
