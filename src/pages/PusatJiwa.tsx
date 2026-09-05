import { lazy } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { IconSparkle } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Jiwa — halaman-halaman yang dibaca orang UNTUK DIRINYA SENDIRI.
//
// Itu batasnya, dan batas itu disengaja. Pemeriksaan Status Mental
// (PsychiatricStatusExam) SENGAJA TIDAK ADA di sini meskipun namanya paling
// dekat: ia perkakas dokumentasi untuk klinisi yang sedang memeriksa orang
// lain, bukan halaman yang dibaca seseorang tentang dirinya. Menaruhnya di
// sini akan mencampur dua pembaca yang berbeda dalam satu tempat, dan orang
// yang sedang tidak baik-baik saja akan menemukan formulir pemeriksaan alih-
// alih sesuatu yang menolongnya.
//
// Urutannya dari yang paling mendesak ke yang paling panjang: penyaringan
// lebih dulu (kalau ada yang perlu ditangani, itu didahulukan), lalu perkakas
// harian, lalu hal-hal yang dibangun perlahan — arah hidup, rasa syukur, dan
// cerita.
//
// Isinya tidak ditulis ulang; komponennya dipasang apa adanya dan tetap lazy.
// ─────────────────────────────────────────────────────────────────────────────

const MentalHealthScreen = lazy(() => import('./MentalHealthScreen').then((m) => ({ default: m.MentalHealthScreen })))
const SubstanceUseScreen = lazy(() => import('./SubstanceUseScreen').then((m) => ({ default: m.SubstanceUseScreen })))
const MindToolkit = lazy(() => import('./MindToolkit').then((m) => ({ default: m.MindToolkit })))
const GratitudeJournal = lazy(() => import('./GratitudeJournal').then((m) => ({ default: m.GratitudeJournal })))
const Ikigai = lazy(() => import('./Ikigai').then((m) => ({ default: m.Ikigai })))
const LifeCompass = lazy(() => import('./LifeCompass').then((m) => ({ default: m.LifeCompass })))
const ResilienceStories = lazy(() => import('./ResilienceStories').then((m) => ({ default: m.ResilienceStories })))
const LifeStory = lazy(() => import('./LifeStory').then((m) => ({ default: m.LifeStory })))

const TABS: TabDef[] = [
  { id: 'saring', label: 'Screening', emoji: '📝', komponen: MentalHealthScreen,
    ringkas: 'Validated self-report screens for mood and anxiety — a starting point, not a diagnosis' },
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
    <HalamanTab
      judul="Mind"
      subjudul="Screening, everyday tools, and the longer work of direction and meaning"
      ikon={<IconSparkle />}
      tabs={TABS}
    />
  )
}

export default PusatJiwa
