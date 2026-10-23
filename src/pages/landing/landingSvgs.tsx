import React from 'react'
import { IconStethoscope } from '../../components/icons'

export const BRAND_POSTER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'><defs><linearGradient id='bg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%23021a10'/><stop offset='50%' stop-color='%23063520'/><stop offset='100%' stop-color='%2301130a'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23bg)'/><circle cx='640' cy='360' r='140' fill='%2300BF63' opacity='0.18' filter='blur(50px)'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='32' font-weight='800' fill='%23ffffff' opacity='0.95'>PANACEAMED</text><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='700' fill='%2334d399' letter-spacing='5'>AI-EMR &amp; LONGEVITY OS</text></svg>`

export const HISTORY_POSTER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'><defs><linearGradient id='hbg' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='%230b1410'/><stop offset='50%' stop-color='%23132e22'/><stop offset='100%' stop-color='%2306150e'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23hbg)'/><circle cx='640' cy='360' r='140' fill='%2300BF63' opacity='0.15' filter='blur(50px)'/><text x='50%' y='48%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='30' font-weight='800' fill='%23ffffff' opacity='0.95'>A HISTORY OF LONGEVITY</text><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' font-weight='700' fill='%2334d399' letter-spacing='4'>FROM ANCIENT CIVILIZATIONS TO AI</text></svg>`

export function IconArrowRight({
  size = 15,
  className = '',
  stroke = 'currentColor',
}: {
  size?: number
  className?: string
  stroke?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function renderEraGlyph(era: string, fallback: string): React.ReactNode {
  if (era === 'Zaman Para Nabi') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="#fde68a"
        stroke="#fde68a"
        strokeWidth="0.5"
        className="text-amber-200 drop-shadow-[0_0_8px_rgba(253,230,138,0.85)]"
        aria-label="Bulan Sabit Emas Zaman Para Nabi"
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
    )
  }
  if (era === 'Mesir Kuno') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-600 dark:text-amber-300"
      >
        <path d="M12 2a4 4 0 0 0-4 4c0 3 4 7 4 7s4-4 4-7a4 4 0 0 0-4-4Z" />
        <path d="M5 12h14" />
        <path d="M12 12v10" />
      </svg>
    )
  }
  if (era === 'Yunani-Romawi') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-700 dark:text-emerald-300"
      >
        <path d="M4 22h16" />
        <path d="M4 6h16" />
        <path d="M6 6v16" />
        <path d="M10 6v16" />
        <path d="M14 6v16" />
        <path d="M18 6v16" />
        <path d="M3 6 12 2l9 4" />
      </svg>
    )
  }
  if (era === 'Dinasti Tiongkok') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-700 dark:text-emerald-300"
      >
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    )
  }
  if (era === 'Kekaisaran Mongol') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-700 dark:text-amber-300"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m4.93 4.93 4.24 4.24" />
        <path d="m14.83 9.17 4.24-4.24" />
        <path d="m14.83 14.83 4.24 4.24" />
        <path d="m9.17 14.83-4.24 4.24" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  }
  if (era === 'Masa Keemasan Islam') {
    return <IconStethoscope size={20} className="text-emerald-600 dark:text-emerald-300" />
  }
  return <span className="text-lg font-serif">{fallback}</span>
}
