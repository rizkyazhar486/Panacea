import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Strava-style live route map: free OpenStreetMap tiles (no API key/billing).
// Draws the recorded track as an orange polyline and follows the latest fix.
export default function RouteMap({ points, height = 220 }: {
  points: { lat: number; lng: number }[]
  height?: number
}) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)
  const dotRef = useRef<L.CircleMarker | null>(null)

  useEffect(() => {
    if (!divRef.current || mapRef.current) return
    const map = L.map(divRef.current, { zoomControl: false, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    map.setView([-6.2, 106.816], 13) // default: Jakarta until first GPS fix
    lineRef.current = L.polyline([], { color: '#fc4c02', weight: 4, opacity: 0.9 }).addTo(map)
    dotRef.current = L.circleMarker([-6.2, 106.816], { radius: 7, color: '#fff', weight: 2, fillColor: '#00BF63', fillOpacity: 1 })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

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

  return <div ref={divRef} style={{ height }} className="w-full rounded-2xl z-0" />
}
