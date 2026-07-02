import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface LatLng { lat: number; lng: number }

// Strava-style live route map: free OpenStreetMap tiles (no API key/billing).
// - Recorded track: solid orange polyline, green dot follows the latest fix.
// - Planned route: clicking the map (when onMapClick is set) adds waypoints,
//   drawn as a dashed purple line with numbered circle markers.
// - Centers on the user's real position on first mount (geolocation), falling
//   back to Jakarta until a fix arrives.
export default function RouteMap({ points, planned = [], onMapClick, height = 220 }: {
  points: LatLng[]
  planned?: LatLng[]
  onMapClick?: (p: LatLng) => void
  height?: number
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const dotRef = useRef<L.CircleMarker | null>(null)
  const planLineRef = useRef<L.Polyline | null>(null)
  const planMarkersRef = useRef<L.CircleMarker[]>([])
  const clickRef = useRef(onMapClick)
  clickRef.current = onMapClick

  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const map = L.map(divRef.current, { zoomControl: false, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    map.setView([-6.2, 106.816], 14) // fallback until geolocation answers
    // Center on the user right away so planning starts from where they are.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { if (mapRef.current) map.setView([pos.coords.latitude, pos.coords.longitude], 16) },
        () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      )
    }
    lineRef.current = L.polyline([], { color: '#fc4c02', weight: 4, opacity: 0.9 }).addTo(map)
    planLineRef.current = L.polyline([], { color: '#8b5cf6', weight: 3, opacity: 0.85, dashArray: '8 6' }).addTo(map)
    dotRef.current = L.circleMarker([-6.2, 106.816], { radius: 7, color: '#fff', weight: 2, fillColor: '#00BF63', fillOpacity: 1 })
    map.on('click', (e: L.LeafletMouseEvent) => {
      clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Recorded track — follow the latest fix.
  useEffect(() => {
    const map = mapRef.current, line = lineRef.current, dot = dotRef.current
    if (!map || !line || !dot) return
    const latlngs = points.map((p) => [p.lat, p.lng] as [number, number])
    line.setLatLngs(latlngs)
    if (latlngs.length > 0) {
      const last = latlngs[latlngs.length - 1]
      dot.setLatLng(last)
      if (!map.hasLayer(dot)) dot.addTo(map)
      if (latlngs.length === 1) map.setView(last, 16)
      else map.panTo(last, { animate: true })
    }
  }, [points])

  // Planned route — dashed line + numbered waypoint markers.
  useEffect(() => {
    const map = mapRef.current, planLine = planLineRef.current
    if (!map || !planLine) return
    planLine.setLatLngs(planned.map((p) => [p.lat, p.lng] as [number, number]))
    planMarkersRef.current.forEach((m) => m.remove())
    planMarkersRef.current = planned.map((p, i) => {
      const isEnd = i === planned.length - 1 && planned.length > 1
      return L.circleMarker([p.lat, p.lng], {
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: i === 0 ? '#00BF63' : isEnd ? '#ef4444' : '#8b5cf6',
        fillOpacity: 1,
      }).addTo(map)
    })
  }, [planned])

  return <div ref={divRef} style={{ height }} className="w-full rounded-2xl z-0" />
}
