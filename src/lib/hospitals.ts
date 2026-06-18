// Demo hospital directory for the "find nearest hospital" referral page.
export interface Hospital {
  id: string
  name: string
  city: string
  distanceKm: number
  type: string
  services: string[]
  phone: string
  rating: number
}

export const HOSPITALS: Hospital[] = [
  {
    id: 'h1',
    name: 'RS Panaceamed Sentral',
    city: 'Jakarta Selatan',
    distanceKm: 2.4,
    type: 'RS Tipe A',
    services: ['Bedah Umum', 'Bedah Saraf', 'ICU', 'Cath Lab'],
    phone: '021-555-0100',
    rating: 4.8,
  },
  {
    id: 'h2',
    name: 'RSUD Kota Harapan',
    city: 'Jakarta Timur',
    distanceKm: 5.1,
    type: 'RS Tipe B',
    services: ['Bedah Umum', 'Mata', 'Obgyn', 'IGD 24 jam'],
    phone: '021-555-0144',
    rating: 4.5,
  },
  {
    id: 'h3',
    name: 'RS Medika Nusantara',
    city: 'Jakarta Pusat',
    distanceKm: 7.8,
    type: 'RS Tipe B',
    services: ['Bedah Ortopedi', 'Jantung', 'Onkologi'],
    phone: '021-555-0188',
    rating: 4.6,
  },
  {
    id: 'h4',
    name: 'Klinik Utama Sehat Bersama',
    city: 'Depok',
    distanceKm: 9.3,
    type: 'Klinik Utama',
    services: ['Bedah Minor', 'Endoskopi', 'Rawat Jalan'],
    phone: '021-555-0210',
    rating: 4.3,
  },
]
