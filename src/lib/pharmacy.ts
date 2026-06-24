import type { PharmacyProduct } from './types'

export const DEFAULT_PRODUCTS: PharmacyProduct[] = [
  { id: 'm1', name: 'Paracetamol 500 mg', desc: 'Pereda demam & nyeri ringan (strip 10)', category: 'Demam & Nyeri', priceIdr: 8000, rx: false, emoji: '💊', color: '#ef4444' },
  { id: 'm2', name: 'Ibuprofen 200 mg', desc: 'Anti-nyeri & anti-radang ringan (strip 10)', category: 'Demam & Nyeri', priceIdr: 12000, rx: false, emoji: '💊', color: '#f97316' },
  { id: 'm3', name: 'OBH Sirup', desc: 'Pereda batuk berdahak (100 ml)', category: 'Batuk & Pilek', priceIdr: 18500, rx: false, emoji: '🧴', color: '#a16207' },
  { id: 'm4', name: 'Cetirizine 10 mg', desc: 'Antihistamin alergi/pilek (strip 10)', category: 'Batuk & Pilek', priceIdr: 15000, rx: false, emoji: '💊', color: '#0ea5e9' },
  { id: 'm5', name: 'Antasida Doen', desc: 'Penetral asam lambung (strip 10)', category: 'Lambung', priceIdr: 9000, rx: false, emoji: '💊', color: '#10b981' },
  { id: 'm6', name: 'Omeprazole 20 mg', desc: 'Penurun asam lambung — perlu resep', category: 'Lambung', priceIdr: 26000, rx: true, emoji: '💊', color: '#8b5cf6' },
  { id: 'm7', name: 'Vitamin C 500 mg', desc: 'Suplemen harian (tabung 30)', category: 'Vitamin', priceIdr: 22000, rx: false, emoji: '🍊', color: '#f59e0b' },
  { id: 'm8', name: 'Vitamin D3 1000 IU', desc: 'Dukungan imun & tulang (botol 60)', category: 'Vitamin', priceIdr: 45000, rx: false, emoji: '☀️', color: '#eab308' },
  { id: 'm9', name: 'Salep Hidrokortison 1%', desc: 'Anti-gatal & radang kulit ringan', category: 'Topikal', priceIdr: 17500, rx: false, emoji: '🧴', color: '#14b8a6' },
  { id: 'm10', name: 'Amoxicillin 500 mg', desc: 'Antibiotik — wajib resep dokter', category: 'Topikal', priceIdr: 32000, rx: true, emoji: '💊', color: '#ec4899' },
]
