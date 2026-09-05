import { lazy } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { IconBook } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Rujukan — yang DIBACA, bukan yang dicatat atau dihitung.
//
// URUTANNYA MENENTUKAN, dan ini bukan soal kerapian.
//
// Saya sempat menolak menggabungkan kelompok ini dengan alasan pertolongan
// pertama dan resusitasi neonatus dibuka dalam keadaan darurat, sehingga
// mengubur keduanya di dalam hub akan memperlambat justru saat kecepatan
// paling menentukan. Setelah diperiksa lagi, keberatan itu berlebihan untuk
// jalur yang sebenarnya dipakai orang: rute lama mengalihkan LANGSUNG ke
// tabnya, jadi jumlah ketukannya sama persis seperti sebelumnya.
//
// Yang tersisa adalah risiko bagi orang yang membuka /rujukan tanpa menyebut
// tab. Karena itu PERTOLONGAN PERTAMA DITARUH PALING DEPAN dan menjadi tab
// bawaan: siapa pun yang mendarat di sini tanpa tujuan tertentu langsung
// mendapat halaman yang paling mungkin ia butuhkan dalam keadaan mendesak,
// bukan daftar isi.
//
// Isinya tidak ditulis ulang; komponennya dipasang apa adanya dan tetap lazy.
// ─────────────────────────────────────────────────────────────────────────────

const FirstAidGuide = lazy(() => import('./FirstAidGuide').then((m) => ({ default: m.FirstAidGuide })))
const NeonatalResuscitationGuide = lazy(() => import('./NeonatalResuscitationGuide').then((m) => ({ default: m.NeonatalResuscitationGuide })))
const EmpiricTherapyReference = lazy(() => import('./EmpiricTherapyReference').then((m) => ({ default: m.EmpiricTherapyReference })))
const DrugInfo = lazy(() => import('./DrugInfo').then((m) => ({ default: m.DrugInfo })))
const LabDecoder = lazy(() => import('./LabDecoder').then((m) => ({ default: m.LabDecoder })))
const ClinicalEvidence = lazy(() => import('./ClinicalEvidence').then((m) => ({ default: m.ClinicalEvidence })))
const ClinicalTrials = lazy(() => import('./ClinicalTrials').then((m) => ({ default: m.ClinicalTrials })))
const PatientEducation = lazy(() => import('./PatientEducation').then((m) => ({ default: m.PatientEducation })))
const EdukasiAwam = lazy(() => import('./EdukasiAwam').then((m) => ({ default: m.EdukasiAwam })))

// Darurat lebih dulu, lalu yang dipakai saat memutuskan, lalu yang dibaca
// dengan waktu luang.
const TABS: TabDef[] = [
  { id: 'pertolongan', label: 'First aid', emoji: '🚑', komponen: FirstAidGuide,
    ringkas: 'What to do in the first minutes — placed first because that is when it is opened' },
  { id: 'neonatus', label: 'Neonatal resus', emoji: '👶', komponen: NeonatalResuscitationGuide,
    ringkas: 'The resuscitation algorithm for a newborn, step by step' },

  { id: 'empiris', label: 'Empiric therapy', emoji: '💊', komponen: EmpiricTherapyReference,
    ringkas: 'First-line antimicrobial choices before culture results return' },
  { id: 'obat', label: 'Drug info', emoji: '🔎', komponen: DrugInfo,
    ringkas: 'Mechanism, target organ, dose and adverse effects from the official label' },
  { id: 'lab', label: 'Lab decoder', emoji: '🧪', komponen: LabDecoder,
    ringkas: 'What a result means, its reference range, and what shifts it' },

  { id: 'bukti', label: 'Evidence', emoji: '📚', komponen: ClinicalEvidence,
    ringkas: 'Live literature search with the papers cited, not recalled' },
  { id: 'uji', label: 'Trials', emoji: '🧾', komponen: ClinicalTrials,
    ringkas: 'Registered studies, including which are still recruiting' },

  { id: 'edukasi', label: 'Patient education', emoji: '🗒️', komponen: PatientEducation,
    ringkas: 'Sheets written to hand to a patient' },
  { id: 'awam', label: 'Health explained', emoji: '💬', komponen: EdukasiAwam,
    ringkas: 'Plain-language explanations of common conditions' },
]

export function PusatRujukan() {
  return (
    <HalamanTab
      judul="Reference"
      subjudul="Emergency guides, therapy and drug reference, evidence, and patient material"
      ikon={<IconBook />}
      tabs={TABS}
    />
  )
}

export default PusatRujukan
