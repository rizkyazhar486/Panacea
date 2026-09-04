import '../styles/metal.css'

// Memetakan tingkatan yang SUDAH dihitung dari data nyata (mis. VO2max
// Elite/Excellent/Good) ke warna logam — bukan skor baru. Lihat
// styles/metal.css untuk kenapa ini terpisah dari sistem "kaca" utama.
export function metalToneForTier(tier: string): 'gold' | 'silver' | 'bronze' | 'steel' {
  if (tier === 'Elite') return 'gold'
  if (tier === 'Excellent') return 'silver'
  if (tier === 'Good') return 'bronze'
  return 'steel'
}

export function MetalBadge({ tier }: { tier: string }) {
  const tone = metalToneForTier(tier)
  return <span className={`metal-tag metal-${tone}`}>{tier}</span>
}
