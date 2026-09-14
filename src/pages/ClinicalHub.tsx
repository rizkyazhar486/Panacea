import { HelpServicesWorkspace } from './HelpServicesWorkspace'

interface Tool { to: string; name: string; what: string; kw: string; tag: string }

// Backward-compatible catalog for global search after Clinical Hub became the
// unified Help/Services workspace. This preserves discoverability without
// reverting the current user-facing workspace.
export const GROUPS: { title: string; emoji: string; tools: Tool[] }[] = [
  {
    title: 'Ask & Decide',
    emoji: '🧠',
    tools: [
      { to: '/chatbot', name: 'AI Chatbot', what: 'Ask a health question and get a sourced, plain-language answer', kw: 'chatbot ai tanya chat asisten pertanyaan kesehatan', tag: 'AI' },
      { to: '/second-opinion', name: 'Second Opinion', what: 'Run a diagnosis or plan past a second, independent read', kw: 'second opinion pendapat kedua banding diagnosis rencana', tag: 'AI' },
      { to: '/evidence', name: 'Clinical Evidence', what: 'The published evidence behind a treatment or claim', kw: 'evidence bukti klinis jurnal studi penelitian guideline pedoman', tag: 'Core' },
      { to: '/trials', name: 'Clinical Trials Finder', what: 'Find trials you may be eligible to join', kw: 'clinical trials uji klinis penelitian rekrutmen eligible peserta', tag: 'Core' },
    ],
  },
  {
    title: 'Practice Tools',
    emoji: '🩺',
    tools: [
      { to: '/emr', name: 'AI-EMR', what: 'Electronic records with AI-assisted note writing', kw: 'emr rekam medis elektronik catatan note soap dokter', tag: 'Dokter' },
      { to: '/clinical', name: 'Clinical Data', what: 'Your patient panel and their clinical numbers', kw: 'clinical data pasien panel klinis dokter', tag: 'Dokter' },
      { to: '/planning', name: 'Planning', what: 'Schedule and plan patient care', kw: 'planning jadwal rencana perawatan dokter', tag: 'Dokter' },
      { to: '/clinical-calculators', name: 'Clinical Calculators', what: 'Scores and risk calculators used at the bedside', kw: 'kalkulator klinis skor risiko score calculator gcs curb wells', tag: 'Core' },
    ],
  },
  {
    title: 'Specialty & Learning',
    emoji: '📚',
    tools: [
      { to: '/sexual-health', name: 'Sexual Health & OB-GYN', what: 'Reproductive, sexual and obstetric health topics', kw: 'sexual health seksual obgyn kandungan kebidanan reproduksi kehamilan kontrasepsi ims sti', tag: 'Core' },
      { to: '/longevity-curriculum', name: 'Longevity Curriculum', what: 'Structured teaching material on longevity medicine', kw: 'longevity curriculum kurikulum kuliah materi ajar penuaan aging', tag: 'Dokter' },
    ],
  },
]

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub