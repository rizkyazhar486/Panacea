import { lazy } from 'react'
import { HalamanTab, type TabDef } from '../components/HalamanTab'
import { IconBook } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Catatan — hal-hal yang DICATAT SESEORANG TENTANG DIRINYA sendiri, dari waktu
// ke waktu.
//
// Itu batas kelompoknya, dan ia berbeda dari kalkulator maupun rujukan.
// Kalkulator dipakai sekali lalu ditutup; rujukan dibaca lalu ditinggalkan.
// Yang ada di sini justru bernilai karena DIULANG: satu entri nyeri tidak
// berarti apa-apa, dua belas entri memperlihatkan polanya. Karena itu semuanya
// menyimpan riwayat, dan karena itu pula mereka layak berada di satu tempat —
// orang datang ke sini untuk mencatat, bukan untuk menghitung.
//
// Isinya tidak ditulis ulang; komponennya dipasang apa adanya dan tetap lazy.
// ─────────────────────────────────────────────────────────────────────────────

const Logs = lazy(() => import('./Logs').then((m) => ({ default: m.Logs })))
const PainDiary = lazy(() => import('./PainDiary').then((m) => ({ default: m.PainDiary })))
const AllergyTracker = lazy(() => import('./AllergyTracker').then((m) => ({ default: m.AllergyTracker })))
const VaccineTracker = lazy(() => import('./VaccineTracker').then((m) => ({ default: m.VaccineTracker })))
const ChildGrowthTracker = lazy(() => import('./ChildGrowthTracker').then((m) => ({ default: m.ChildGrowthTracker })))
const DermatologyLesionMapper = lazy(() => import('./DermatologyLesionMapper').then((m) => ({ default: m.DermatologyLesionMapper })))
const BloodDonation = lazy(() => import('./BloodDonation').then((m) => ({ default: m.BloodDonation })))
const ToxinChecklist = lazy(() => import('./ToxinChecklist').then((m) => ({ default: m.ToxinChecklist })))
const VisitPrepChecklist = lazy(() => import('./VisitPrepChecklist').then((m) => ({ default: m.VisitPrepChecklist })))
const BiologicalAge = lazy(() => import('./BiologicalAge').then((m) => ({ default: m.BiologicalAge })))

// Urutannya dari yang paling sering dibuka ke yang paling jarang.
const TABS: TabDef[] = [
  { id: 'harian', label: 'Log', emoji: '📔', komponen: Logs,
    ringkas: 'The general daily log — everything recorded in one stream' },
  { id: 'nyeri', label: 'Pain', emoji: '📈', komponen: PainDiary,
    ringkas: 'Site, severity and timing — one entry says little, twelve show the pattern' },
  { id: 'alergi', label: 'Allergy', emoji: '🌾', komponen: AllergyTracker,
    ringkas: 'Reactions, suspected triggers, and what was taken at the time' },
  { id: 'vaksin', label: 'Vaccines', emoji: '💉', komponen: VaccineTracker,
    ringkas: 'What was given, when, and what is due' },
  { id: 'tumbuh', label: 'Child growth', emoji: '📏', komponen: ChildGrowthTracker,
    ringkas: 'Weight, length and head circumference against WHO curves' },
  { id: 'kulit', label: 'Skin lesions', emoji: '🔍', komponen: DermatologyLesionMapper,
    ringkas: 'Mapping and photographing lesions so change over time is visible' },
  { id: 'donor', label: 'Blood donation', emoji: '🩸', komponen: BloodDonation,
    ringkas: 'Donation history and when you are eligible again' },
  { id: 'paparan', label: 'Exposures', emoji: '🧪', komponen: ToxinChecklist,
    ringkas: 'Occupational and household exposures worth recording once' },
  { id: 'kunjungan', label: 'Visit prep', emoji: '📋', komponen: VisitPrepChecklist,
    ringkas: 'What to bring and what to ask, written before you are in the room' },
  { id: 'usia', label: 'Biological age', emoji: '⏱️', komponen: BiologicalAge,
    ringkas: 'An estimate from your own recorded measures — and what it cannot mean' },
]

export function PusatCatatan() {
  return (
    <HalamanTab
      judul="Records"
      subjudul="What you record about yourself over time — logs, diaries and trackers"
      ikon={<IconBook />}
      tabs={TABS}
    />
  )
}

export default PusatCatatan
