import { lazy } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { IconSparkle } from '../components/icons'
import { BatasKlaimKesehatan } from '../components/BatasKlaimKesehatan'

// ─────────────────────────────────────────────────────────────────────────────
// Jiwa — halaman-halaman yang dibaca orang UNTUK DIRINYA SENDIRI.
//
// Itu batasnya, dan batas itu disengaja. Pemeriksaan Status Mental
// (PsychiatricStatusExam) SENGAJA TIDAK ADA di sini meskipun namanya paling
// dekat: ia perkakas dokumentasi untuk klinisi yang sedang memeriksa orang
// lain, bukan halaman yang dibaca seseorang tentang dirinya. Menaruhnya di
// sini akan mencampur dua pembaca yang berbeda dalam satu tempat.
//
// Safety plan diletakkan paling depan karena Panacea adalah produk yang ingin
// mempertahankan hidup dan fungsi. Ia local-first, tidak mengklaim memprediksi
// bunuh diri, tidak dimonitor diam-diam, dan tidak menggantikan pertolongan
// darurat. Setelah itu baru screening, toolkit harian, arah hidup dan cerita.
// ─────────────────────────────────────────────────────────────────────────────

const MentalSafetyPlan = lazy(() => import('./mental/MentalSafetyPlan').then((m) => ({ default: m.MentalSafetyPlan })))
const MentalHealthScreen = lazy(() => import('./mental/MentalHealthScreen').then((m) => ({ default: m.MentalHealthScreen })))
const SubstanceUseScreen = lazy(() => import('./mental/SubstanceUseScreen').then((m) => ({ default: m.SubstanceUseScreen })))
const MindToolkit = lazy(() => import('./mental/MindToolkit').then((m) => ({ default: m.MindToolkit })))
const GratitudeJournal = lazy(() => import('./mental/GratitudeJournal').then((m) => ({ default: m.GratitudeJournal })))
const Ikigai = lazy(() => import('./mental/Ikigai').then((m) => ({ default: m.Ikigai })))
const LifeCompass = lazy(() => import('./mental/LifeCompass').then((m) => ({ default: m.LifeCompass })))
const ResilienceStories = lazy(() => import('./mental/ResilienceStories').then((m) => ({ default: m.ResilienceStories })))
const LifeStory = lazy(() => import('./mental/LifeStory').then((m) => ({ default: m.LifeStory })))

const TABS: TabDef[] = [
  { id: 'aman', label: 'Safety plan', emoji: '🛟', komponen: MentalSafetyPlan,
    ringkas: 'A private local-first plan for warning signs, coping, trusted support and urgent escalation' },
  { id: 'saring', label: 'Screening', emoji: '📝', komponen: MentalHealthScreen,
    ringkas: 'Published self-report screens for mood and anxiety — a starting point, not a diagnosis' },
  { id: 'zat', label: 'Substance use', emoji: '🚭', komponen: SubstanceUseScreen,
    ringkas: 'Alcohol, tobacco and other substance screening, answered privately' },
  { id: 'alat', label: 'Toolkit', emoji: '🧰', komponen: MindToolkit,
    ringkas: 'Techniques that work in the moment — grounding, reframing, sleep and stress' },
  { id: 'syukur', label: 'Gratitude', emoji: '🌤️', komponen: GratitudeJournal,
    ringkas: 'A short daily entry — one of the few habits with consistent evidence behind it' },
  { id: 'ikigai', label: 'Ikigai', emoji: '🎯', komponen: Ikigai,
    ringkas: 'What you love, what you are good at, what the world needs, what pays' },
  { id: 'arah', label: 'Compass', emoji: '🧭', komponen: LifeCompass,
    ringkas: 'Values and direction, and whether the week matched them' },
  { id: 'ketahanan', label: 'Resilience', emoji: '🪨', komponen: ResilienceStories,
    ringkas: 'Accounts from people who came through something hard' },
  { id: 'kisah', label: 'Life story', emoji: '📖', komponen: LifeStory,
    ringkas: 'Your own account, written down and kept' },
]

export function PusatJiwa() {
  return (
    <>
      <BatasKlaimKesehatan permukaan="wellness.pusat-jiwa" />
      <HalamanTab
      judul="Mind"
      subjudul="Safety, screening, everyday tools, connection, direction and meaning"
      ikon={<IconSparkle />}
      tabs={TABS}
    />
    </>
  )
}

export default PusatJiwa
