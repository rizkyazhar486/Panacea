import React from 'react'
import { IconActivity, IconCpu, IconMicroscope, IconShield, IconSparkle } from '../../components/icons'

/** High-resolution Z-Anatomy studio posters (CC BY-SA 4.0) replacing cartoon SVG posters. */
export const BRAND_POSTER = '/landing/cardio-vascular-uhd.webp'

export const HISTORY_POSTER = '/landing/neuro-cranial-uhd.webp'

export function IconArrowRight({
  size = 16,
  stroke = 'currentColor',
  className = '',
}: {
  size?: number
  stroke?: string
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

/** Crisp clinical/architectural glyphs for Odyssey timeline milestones (no cartoon doodles). */
export function renderEraGlyph(era: string, fallback: string): React.ReactNode {
  const key = era.toLowerCase()
  if (key.includes('kuno') || key.includes('mesir') || key.includes('yunani')) {
    return <IconShield size={18} />
  }
  if (key.includes('emas') || key.includes('renaissance') || key.includes('anatomi')) {
    return <IconMicroscope size={18} />
  }
  if (key.includes('vaksin') || key.includes('mikro') || key.includes('gen')) {
    return <IconActivity size={18} />
  }
  if (key.includes('saraf') || key.includes('neuro') || key.includes('kognitif')) {
    return <IconSparkle size={18} />
  }
  if (key.includes('ai') || key.includes('komputasi') || key.includes('robot')) {
    return <IconCpu size={18} />
  }
  return <span aria-hidden="true" className="text-xs font-bold uppercase tracking-wider">{fallback.slice(0, 2)}</span>
}
