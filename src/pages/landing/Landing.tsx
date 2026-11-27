import { useState, useEffect } from 'react'
import { api, backendEnabled, type Health } from '../../lib/api'
import { getTheme, toggleTheme, type Theme } from '../../lib/theme'
import { PricingSection } from '../../components/PricingSection'
import { LandingHeader, HeroSection, FourDoorsSection, LandingFooter } from './sections'
import { RenderWhenNear } from './components/RenderWhenNear'

// The public page: what Panaceamed is (one body, all your health data), the four doors into it, the price, and the
// legal footer. Owner directive 2026-11-27 replaced the earlier ten-section page (films, history, news, changelog,
// feature bento) with this compact one; nothing here shows example health numbers.

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [promo, setPromo] = useState<Health['promo'] | null>(null)

  useEffect(() => {
    if (backendEnabled) {
      api.health().then((h) => setPromo(h.promo ?? null)).catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen bg-white text-neutral-950 dark:bg-[#05070b] dark:text-neutral-100">
      <LandingHeader theme={theme} onToggleTheme={() => setTheme(toggleTheme())} onMasuk={onMasuk} />
      <main>
        <HeroSection onMasuk={onMasuk} />
        <FourDoorsSection />
        {/* Below the first two screens: rendered as it nears the viewport (measured heights at 390 / 1440 px). */}
        <RenderWhenNear phone={3273} desktop={1816}><PricingSection onMasuk={onMasuk} promo={promo} /></RenderWhenNear>
      </main>
      <LandingFooter />
    </div>
  )
}
