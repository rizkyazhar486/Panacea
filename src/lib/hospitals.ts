// Demo facility directory for the GPS "find nearest" referral feature.
export type FacilityKind = 'RS' | 'Klinik' | 'Apotek'
export interface Hospital {
  id: string
  name: string
  city: string
  kind: FacilityKind
  lat: number
  lng: number
  distanceKm: number // fallback when GPS is unavailable
  type: string
  services: string[]
  phone: string
  rating: number
  emergency?: boolean
}

export const HOSPITALS: Hospital[] = [
  { id: 'h1', name: 'RS Panaceamed Sentral', city: 'Jakarta Selatan', kind: 'RS', lat: -6.2615, lng: 106.8106, distanceKm: 2.4, type: 'RS Tipe A', services: ['Bedah Umum', 'Bedah Saraf', 'ICU', 'Cath Lab'], phone: '021-555-0100', rating: 4.8, emergency: true },
  { id: 'h2', name: 'RSUD Kota Harapan', city: 'Jakarta Timur', kind: 'RS', lat: -6.2250, lng: 106.9004, distanceKm: 5.1, type: 'RS Tipe B', services: ['Bedah Umum', 'Mata', 'Obgyn', 'IGD 24 jam'], phone: '021-555-0144', rating: 4.5, emergency: true },
  { id: 'h3', name: 'RS Medika Nusantara', city: 'Jakarta Pusat', kind: 'RS', lat: -6.1864, lng: 106.8340, distanceKm: 7.8, type: 'RS Tipe B', services: ['Bedah Ortopedi', 'Jantung', 'Onkologi'], phone: '021-555-0188', rating: 4.6, emergency: true },
  { id: 'k1', name: 'Klinik Utama Sehat Bersama', city: 'Depok', kind: 'Klinik', lat: -6.4025, lng: 106.7942, distanceKm: 9.3, type: 'Klinik Utama', services: ['Bedah Minor', 'Endoskopi', 'Rawat Jalan'], phone: '021-555-0210', rating: 4.3 },
  { id: 'k2', name: 'Klinik Pratama Bangka', city: 'Jakarta Selatan', kind: 'Klinik', lat: -6.2531, lng: 106.8175, distanceKm: 1.2, type: 'Klinik Pratama', services: ['Dokter Umum', 'Vaksin', 'Rawat Jalan'], phone: '021-555-0233', rating: 4.4 },
  { id: 'a1', name: 'Apotek Panaceamed Bangka', city: 'Jakarta Selatan', kind: 'Apotek', lat: -6.2560, lng: 106.8130, distanceKm: 0.8, type: 'Apotek', services: ['Obat Bebas', 'Tebus Resep', 'Antar 24 jam'], phone: '021-555-0250', rating: 4.7 },
  { id: 'a2', name: 'Apotek Sehat Mampang', city: 'Jakarta Selatan', kind: 'Apotek', lat: -6.2419, lng: 106.8203, distanceKm: 3.0, type: 'Apotek', services: ['Obat Bebas', 'Tebus Resep'], phone: '021-555-0260', rating: 4.5 },
]

// Haversine distance in km between two coordinates.
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s))
}
