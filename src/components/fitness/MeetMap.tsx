import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Map view for Club Hub meets — free OpenStreetMap tiles (no API key), one
// pin per venue showing how many people have joined (community-sport-app
// style). Clicking a pin opens that meet's detail sheet via onSelect.

export interface MeetPin {
  id: string
  lat: number
  lng: number
  count: number
  cap: number
  emoji: string
  title: string
  time: string
}

export default function MeetMap({ pins, onSelect, height = 340 }: {
  pins: MeetPin[]
  onSelect: (id: string) => void
  height?: number
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const selectRef = useRef(onSelect)
  selectRef.current = onSelect

  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const map = L.map(divRef.current, { zoomControl: false, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    map.setView([-6.22, 106.8], 12)
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    for (const m of markersRef.current) m.remove()
    markersRef.current = pins.map((p) => {
      const full = p.count >= p.cap
      const icon = L.divIcon({
        className: '',
        html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.25))">
          <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9999px;background:#fff;">
            <div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:${full ? '#ef4444' : '#00BF63'};color:#fff;font:900 13px system-ui">${p.count}</div>
          </div>
          <div style="width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #fff;margin-top:-2px"></div>
        </div>`,
        iconSize: [38, 48],
        iconAnchor: [19, 48],
      })
      const marker = L.marker([p.lat, p.lng], { icon, title: `${p.emoji} ${p.title} — ${p.time}` })
        .addTo(map)
        .on('click', () => selectRef.current(p.id))
      return marker
    })
    if (pins.length > 0) {
      map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])).pad(0.25))
    }
  }, [pins])

  return <div ref={divRef} style={{ height }} className="w-full overflow-hidden rounded-2xl" data-meetmap />
}
