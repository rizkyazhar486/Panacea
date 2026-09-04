import { useState } from 'react'
import { KUTIPAN_KETAHANAN } from '../lib/kutipanKetahanan'
import '../styles/metal.css'

const TONE: Record<string, string> = {
  Roman: 'metal-gold',
  Arabic: 'metal-silver',
  Samurai: 'metal-steel',
  Nordic: 'metal-bronze',
  Proverb: 'metal-gold',
  Reminder: 'metal-blue',
}

// Satu kutipan nyata (dengan sumber yang bisa diperiksa) dari salah satu
// tradisi — dipilih acak sekali per mount, bukan dikarang untuk halaman ini.
export function ResilienceQuoteCard({ className = '' }: { className?: string }) {
  const [q] = useState(() => KUTIPAN_KETAHANAN[Math.floor(Math.random() * KUTIPAN_KETAHANAN.length)])
  return (
    <div className={`metal-forge rounded-2xl p-5 ${className}`}>
      <span className={`metal-tag ${TONE[q.tradition]} relative`}>{q.tradition}</span>
      {q.original && <p className="relative mt-3 text-lg leading-snug text-white/90" dir="auto">{q.original}</p>}
      <p className="relative mt-2 text-[15px] font-semibold italic leading-snug text-white">“{q.quote}”</p>
      <p className="relative mt-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">{q.source}</p>
    </div>
  )
}
