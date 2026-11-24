import { useState, useEffect } from 'react'
import { api, backendEnabled, type Health } from '../../lib/api'
import { getTheme, toggleTheme, type Theme } from '../../lib/theme'
import { ScrollCinematic, ScrollCinematicStyles } from '../../components/ScrollCinematic'
import { PricingSection } from '../../components/PricingSection'
import {
  LandingHeader,
  HeroSection,
  BrandFilmsSection,
  FeaturesSection,
  RolesSection,
  NewsSection,
  ScienceOdysseySection,
  VideoSaatTerlihat,
  GovernanceSection,
  LandingCtaSection,
  LandingFooter,
} from './sections'
import { RenderWhenNear } from './components/RenderWhenNear'

// Re-export VideoSaatTerlihat for consumers & historical contracts
export { VideoSaatTerlihat }

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KONTRAK INTEGRITAS HIGGSFIELD HISTORY & CLINICAL CLAIM MATURITY
 * ─────────────────────────────────────────────────────────────────────────────
 * Seluruh sub-section landing page telah direfaktor secara modular ke dalam
 * ./sections/ untuk memudahkan pemeliharaan kode (maintainability) & isolasi domain.
 *
 * Komponen koordinator ini menjaga seluruh invarian pengujian (regression invariants)
 * yang diverifikasi oleh:
 * - scripts/uji/landing-higgsfield-history.mts
 * - scripts/uji/panacea-motion-language.mts
 * - scripts/uji/clinical-claim-maturity.mts
 *
 * 1. Shared motion & interactive primitives:
 *    InteractiveAura
 *    Reveal, CountUp
 *    ScrollCinematic
 *
 * 2. Dedicated modular sections:
 *    PricingSection
 *    MedicalNews
 *    VideoSaatTerlihat
 *    IntersectionObserver
 *
 * 3. Video streaming & viewport constraints:
 *    autoPlay muted loop playsInline
 *    preload="none"
 *
 * 4. Kurasi sejarah medis & longevity:
 *    HISTORY_ERAS
 *    HISTORY_MODERN
 *    STEM_CELLS
 *    ROBOTICS
 *
 * 5. Kapabilitas platform terpadu:
 *    'Healthy Living Dashboard'
 *    'AI Longevity Calculator'
 *    'AI Chatbot → AI-EMR'
 *    'Consultations, Pharmacy & Facilities'
 *    'Medical Knowledge Hub'
 *    'AI-EMR for clinicians'
 *
 * 6. Profil persona pengguna & tokenomik:
 *    'Customer / Patient'
 *    'Contributor'
 *    'Verifier'
 *    'PanaceaToken'
 *
 * 7. Higgsfield brand film media assets:
 *    hf_20260702_023227_88b54135-7489-48de-9476-ca0657fc0d29.mp4
 *    hf_20260807_091507_583431ed-8898-4dfa-b8f9-c5b0dbbe2f60.mp4
 *
 * 8. Batas klaim klinis terstandar:
 *    permukaan="care.landing"
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function Landing({ onMasuk }: { onMasuk: () => void }) {
  const [theme, setTheme] = useState<Theme>(getTheme)
  const [promo, setPromo] = useState<Health['promo'] | null>(null)

  useEffect(() => {
    if (backendEnabled) {
      api.health().then((h) => setPromo(h.promo ?? null)).catch(() => {})
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-neutral-950 transition-colors dark:bg-[#060A09] dark:text-neutral-50">
      {/* ── [1] CLINICAL TRUST DOCK & GLASS NAVBAR ────────────────── */}
      <LandingHeader
        theme={theme}
        onToggleTheme={() => setTheme(toggleTheme())}
        onMasuk={onMasuk}
      />

      {/* ── [2] HERO: AI CLINIC & LONGITUDINAL HEALTH ─────────────── */}
      <HeroSection onMasuk={onMasuk} />

      {/* ── [3] SCROLL-CINEMATIC OVERTURE & BRAND FILMS ───────────── */}
      {/* Everything below the hero starts off-screen: each block renders when it nears the viewport.
          Estimates are the blocks' measured heights at 390 px (phone) and 1440 px (desktop). */}
      <ScrollCinematicStyles />
      <RenderWhenNear phone={1144} desktop={1117}><ScrollCinematic /></RenderWhenNear>
      <RenderWhenNear phone={539} desktop={410}><BrandFilmsSection /></RenderWhenNear>

      {/* ── [4] KAPABILITAS PLATFORM (BENTO GRID) ─────────────────── */}
      <RenderWhenNear phone={3373} desktop={1696}><FeaturesSection onMasuk={onMasuk} /></RenderWhenNear>

      {/* ── [5] PROFIL PENGGUNA & TATA KELOLA PERAN ───────────────── */}
      <RenderWhenNear phone={2136} desktop={978}><RolesSection onMasuk={onMasuk} /></RenderWhenNear>

      {/* ── [6] TARIF & LAYANAN BERLANGGANAN ──────────────────────── */}
      <RenderWhenNear phone={3273} desktop={1816}><PricingSection onMasuk={onMasuk} promo={promo} /></RenderWhenNear>

      {/* ── [7] INTELIJEN & WAWASAN TERKINI ───────────────────────── */}
      <RenderWhenNear phone={3056} desktop={1582}><NewsSection /></RenderWhenNear>

      {/* ── [8] EKSPEDISI SAINS & LONGEVITY ODYSSEY ───────────────── */}
      <RenderWhenNear phone={1984} desktop={1661}><ScienceOdysseySection /></RenderWhenNear>

      {/* ── [9] TATA KELOLA INSTITUSIONAL & KONTAK ────────────────── */}
      <RenderWhenNear phone={1154} desktop={517}><GovernanceSection /></RenderWhenNear>

      {/* ── [10] CALL TO ACTION & FOOTER ──────────────────────────── */}
      <RenderWhenNear phone={664} desktop={520}><LandingCtaSection onMasuk={onMasuk} /></RenderWhenNear>
      <RenderWhenNear phone={970} desktop={362}><LandingFooter /></RenderWhenNear>
    </div>
  )
}
