import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Spanduk harian memakai animasi inline `fly-in-drop`; tanpa aturan media
// ini ia meluncur melewati bilah atas bagi pengguna "reduce motion" OS.
const css = readFileSync(new URL('../../src/index.css', import.meta.url), 'utf8')
const banner = readFileSync(new URL('../../src/components/dashboard/DailyQuoteBanner.tsx', import.meta.url), 'utf8')

/** Benar bila animasi kelas ini dimatikan di bawah preferensi OS reduce-motion. */
export function menghormatiReduceMotion(sumber: string, kelas: string): boolean {
  const media = sumber.match(/@media \(prefers-reduced-motion: reduce\) \{([^}]*\{[^}]*\}[^}]*)\}/g) ?? []
  return media.some((b) => b.includes(`.${kelas}`) && /animation:\s*none\s*!important/.test(b))
}

assert.ok(banner.includes('fly-in-drop'), 'spanduk tidak lagi memakai fly-in-drop; perbarui uji ini')
assert.equal(menghormatiReduceMotion(css, 'fly-in-drop'), true, 'fly-in-drop tidak dimatikan di bawah prefers-reduced-motion')
// Negatif: kelas lain dan CSS tanpa aturan ditolak.
assert.equal(menghormatiReduceMotion(css, 'kelas-yang-tidak-ada'), false)
assert.equal(menghormatiReduceMotion('.fly-in-drop { animation: none !important; }', 'fly-in-drop'), false, 'aturan tanpa @media tidak boleh dihitung')
assert.equal(menghormatiReduceMotion('@media (prefers-reduced-motion: reduce) { .fly-in-drop { animation: none; } }', 'fly-in-drop'), false, 'tanpa !important kalah dari style inline')
console.log('banner-hormati-reduce-motion: aturan OS ada; kelas lain, tanpa @media, dan tanpa !important ditolak')
