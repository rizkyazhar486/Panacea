// Free, keyless address → coordinates lookup via OpenStreetMap's Nominatim
// public search API. Used sparingly (once per meet a user hosts), which is
// well within Nominatim's usage policy for occasional client-side lookups.
// No API key, matching the rest of the map stack (Leaflet + OSM tiles).
export async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim()
  if (!q) return null
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as { lat: string; lon: string }[]
    if (!rows.length) return null
    const lat = Number(rows[0].lat)
    const lng = Number(rows[0].lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch {
    return null
  }
}
