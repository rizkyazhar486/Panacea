import { HelpServicesWorkspace } from './HelpServicesWorkspace'

interface SearchTool { to: string; name: string; kw: string }

// Preserve the previous Clinical Hub destinations for global search while the
// visible route stays on the unified HelpServicesWorkspace.
export const GROUPS: { title: string; tools: SearchTool[] }[] = [
  {
    title: 'Ask & Decide',
    tools: [
      { to: '/chatbot', name: 'AI Chatbot', kw: 'chatbot ai tanya chat asisten pertanyaan kesehatan' },
      { to: '/second-opinion', name: 'Second Opinion', kw: 'second opinion pendapat kedua banding diagnosis rencana' },
      { to: '/evidence', name: 'Clinical Evidence', kw: 'evidence bukti klinis jurnal studi penelitian guideline pedoman' },
      { to: '/trials', name: 'Clinical Trials Finder', kw: 'clinical trials uji klinis penelitian rekrutmen eligible peserta' },
    ],
  },
  {
    title: 'Practice Tools',
    tools: [
      { to: '/emr', name: 'AI-EMR', kw: 'emr rekam medis elektronik catatan note soap dokter' },
      { to: '/clinical', name: 'Clinical Data', kw: 'clinical data pasien panel klinis dokter' },
      { to: '/planning', name: 'Planning', kw: 'planning jadwal rencana perawatan dokter' },
      { to: '/clinical-calculators', name: 'Clinical Calculators', kw: 'kalkulator klinis skor risiko score calculator gcs curb wells' },
    ],
  },
  {
    title: 'Specialty & Learning',
    tools: [
      { to: '/sexual-health', name: 'Sexual Health & OB-GYN', kw: 'sexual health seksual obgyn kandungan kebidanan reproduksi kehamilan kontrasepsi ims sti' },
      { to: '/longevity-curriculum', name: 'Longevity Curriculum', kw: 'longevity curriculum kurikulum kuliah materi ajar penuaan aging' },
    ],
  },
]

export function ClinicalHub() {
  return <HelpServicesWorkspace />
}

export default ClinicalHub
