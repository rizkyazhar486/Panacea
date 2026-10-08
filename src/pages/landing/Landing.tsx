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
    <div className="min-h-screen bg-white text-ink dark:bg-black dark:text-neutral-100">
      {/* ── [1] CLINICAL TRUST DOCK & GLASS NAVBAR ────────────────── */}
      <LandingHeader
        theme={theme}
        onToggleTheme={() => setTheme(toggleTheme())}
        onMasuk={onMasuk}
      />

      {/* ── [2] HERO: AI CLINIC & LONGITUDINAL HEALTH ─────────────── */}
      <HeroSection onMasuk={onMasuk} />

      {/* ── [3] SCROLL-CINEMATIC OVERTURE & BRAND FILMS ───────────── */}
      <ScrollCinematicStyles />
      <ScrollCinematic />
      <BrandFilmsSection />

      {/* ── [4] KAPABILITAS PLATFORM (BENTO GRID) ─────────────────── */}
      <FeaturesSection onMasuk={onMasuk} />

      {/* ── [5] PROFIL PENGGUNA & TATA KELOLA PERAN ───────────────── */}
      <RolesSection onMasuk={onMasuk} />

      {/* ── [6] TARIF & LAYANAN BERLANGGANAN ──────────────────────── */}
      <PricingSection onMasuk={onMasuk} promo={promo} />

      {/* ── [7] INTELIJEN & WAWASAN TERKINI ───────────────────────── */}
      <NewsSection />

      {/* ── [8] EKSPEDISI SAINS & LONGEVITY ODYSSEY ───────────────── */}
      <ScienceOdysseySection />

      {/* ── [9] TATA KELOLA INSTITUSIONAL & KONTAK ────────────────── */}
      <GovernanceSection />

      {/* ── [10] CALL TO ACTION & FOOTER ──────────────────────────── */}
      <LandingCtaSection onMasuk={onMasuk} />
      <LandingFooter />
    </div>
  )
}
