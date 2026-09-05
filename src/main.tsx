import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { applyAppearance } from './lib/theme'
import { applyLang, getLang, muatKamusKalimat, umumkanBahasa } from './lib/i18n'
import { initPwaInstall } from './lib/pwa'
import { StoreProvider } from './lib/store'
import { Shell } from './components/Shell'
import { RangkaHalaman } from './components/Rangka'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppStatus } from './components/AppStatus'
import { OfflineBanner } from './components/OfflineBanner'
const OsceUkmppd = lazy(() => import('./pages/OsceUkmppd').then((m) => ({ default: m.OsceUkmppd })))
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))
const Chatbot = lazy(() => import('./pages/Chatbot').then((m) => ({ default: m.Chatbot })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
// Komponen tiap skor tidak lagi diimpor di sini: halaman gabungan yang
// memuatnya sendiri secara lazy, sehingga hanya skor yang benar-benar dibuka
// yang diunduh.
const PusatRujukan = lazy(() => import('./pages/PusatRujukan').then((m) => ({ default: m.PusatRujukan })))
const PusatCatatan = lazy(() => import('./pages/PusatCatatan').then((m) => ({ default: m.PusatCatatan })))
const PusatJiwa = lazy(() => import('./pages/PusatJiwa').then((m) => ({ default: m.PusatJiwa })))
const PusatGizi = lazy(() => import('./pages/PusatGizi').then((m) => ({ default: m.PusatGizi })))
const ClinicalScores = lazy(() => import('./pages/ClinicalScores').then((m) => ({ default: m.ClinicalScores })))
const Translator = lazy(() => import('./pages/Translator').then((m) => ({ default: m.Translator })))
const BodyExplorer = lazy(() => import('./pages/BodyExplorer').then((m) => ({ default: m.BodyExplorer })))
const Consult = lazy(() => import('./pages/Consult').then((m) => ({ default: m.Consult })))
const Hospitals = lazy(() => import('./pages/Hospitals').then((m) => ({ default: m.Hospitals })))
const Pharmacy = lazy(() => import('./pages/Pharmacy').then((m) => ({ default: m.Pharmacy })))
const Orders = lazy(() => import('./pages/Orders').then((m) => ({ default: m.Orders })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))

// Lazy-load role-specific / heavier secondary pages so the initial bundle stays
// small; they're fetched on demand when first navigated to.
const Athlete = lazy(() => import('./pages/Athlete').then((m) => ({ default: m.Athlete })))
const SexualHealth = lazy(() => import('./pages/SexualHealth').then((m) => ({ default: m.SexualHealth })))
const EMR = lazy(() => import('./pages/EMR').then((m) => ({ default: m.EMR })))
const Planning = lazy(() => import('./pages/Planning').then((m) => ({ default: m.Planning })))
const CareEpisodePage = lazy(() => import('./pages/CareEpisode').then((m) => ({ default: m.CareEpisodePage })))
const Marketplace = lazy(() => import('./pages/Marketplace').then((m) => ({ default: m.Marketplace })))
const MyMaterials = lazy(() => import('./pages/MyMaterials').then((m) => ({ default: m.MyMaterials })))
const Verification = lazy(() => import('./pages/Verification').then((m) => ({ default: m.Verification })))
const Billing = lazy(() => import('./pages/Billing').then((m) => ({ default: m.Billing })))
const Pricing = lazy(() => import('./pages/Pricing').then((m) => ({ default: m.Pricing })))
const Architecture = lazy(() => import('./pages/Architecture').then((m) => ({ default: m.Architecture })))
const Owner = lazy(() => import('./pages/Owner').then((m) => ({ default: m.Owner })))
const Editor = lazy(() => import('./pages/Editor').then((m) => ({ default: m.Editor })))
const Admin = lazy(() => import('./pages/Admin').then((m) => ({ default: m.Admin })))
const Legal = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Legal })))
const Community = lazy(() => import('./pages/Community').then((m) => ({ default: m.Community })))
const Feed = lazy(() => import('./pages/Feed'))
const SemuaFitur = lazy(() => import('./pages/SemuaFitur'))
const RingkasanKarya = lazy(() => import('./pages/RingkasanKarya'))
const Tutorial = lazy(() => import('./pages/Tutorial'))
const VitaPulse = lazy(() => import('./pages/VitaPulse').then((m) => ({ default: m.VitaPulse })))
const RealisticHealth = lazy(() => import('./pages/RealisticHealth').then((m) => ({ default: m.RealisticHealth })))
const MoneyHub = lazy(() => import('./pages/MoneyHub').then((m) => ({ default: m.MoneyHub })))
const Notifications = lazy(() => import('./pages/Notifications').then((m) => ({ default: m.Notifications })))
const HeartRateLog = lazy(() => import('./pages/HeartRateLog').then((m) => ({ default: m.HeartRateLog })))
const SleepPattern = lazy(() => import('./pages/SleepPattern').then((m) => ({ default: m.SleepPattern })))
const TrainingPhysiology = lazy(() => import('./pages/TrainingPhysiology').then((m) => ({ default: m.TrainingPhysiology })))
const EnduranceTools = lazy(() => import('./pages/EnduranceTools').then((m) => ({ default: m.EnduranceTools })))
const ClinicalTrackers = lazy(() => import('./pages/ClinicalTrackers').then((m) => ({ default: m.ClinicalTrackers })))
const Connect = lazy(() => import('./pages/Connect').then((m) => ({ default: m.Connect })))
const OwnerAnalytics = lazy(() => import('./pages/OwnerAnalytics').then((m) => ({ default: m.OwnerAnalytics })))
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })))
const BodyComposition = lazy(() => import('./pages/BodyComposition').then((m) => ({ default: m.BodyComposition })))
const InitialAssessment = lazy(() => import('./pages/InitialAssessment').then((m) => ({ default: m.InitialAssessment })))
const Readiness = lazy(() => import('./pages/Readiness').then((m) => ({ default: m.Readiness })))
const Longevity = lazy(() => import('./pages/Longevity').then((m) => ({ default: m.Longevity })))
const OrganVitality = lazy(() => import('./pages/OrganVitality').then((m) => ({ default: m.OrganVitality })))
const HealthProfile = lazy(() => import('./pages/HealthProfile').then((m) => ({ default: m.HealthProfile })))
const HealthSyncTutorial = lazy(() => import('./pages/HealthSyncTutorial').then((m) => ({ default: m.HealthSyncTutorial })))
const SportsScores = lazy(() => import('./pages/SportsScores').then((m) => ({ default: m.SportsScores })))
const ClinicalCalculators = lazy(() => import('./pages/ClinicalCalculators').then((m) => ({ default: m.ClinicalCalculators })))
const LongevityCurriculum = lazy(() => import('./pages/LongevityCurriculum').then((m) => ({ default: m.LongevityCurriculum })))
const MedStudyHub = lazy(() => import('./pages/MedStudyHub').then((m) => ({ default: m.MedStudyHub })))
const AestheticVitality = lazy(() => import('./pages/AestheticVitality').then((m) => ({ default: m.AestheticVitality })))
const RealityCheck = lazy(() => import('./pages/RealityCheck').then((m) => ({ default: m.RealityCheck })))
const FamilyHealth = lazy(() => import('./pages/FamilyHealth').then((m) => ({ default: m.FamilyHealth })))
const EmergencyCard = lazy(() => import('./pages/EmergencyCard').then((m) => ({ default: m.EmergencyCard })))
const AirQuality = lazy(() => import('./pages/AirQuality').then((m) => ({ default: m.AirQuality })))
const DataLab = lazy(() => import('./pages/DataLab').then((m) => ({ default: m.DataLab })))
const GeneInfo = lazy(() => import('./pages/GeneInfo').then((m) => ({ default: m.GeneInfo })))
const Harada = lazy(() => import('./pages/Harada').then((m) => ({ default: m.Harada })))
const Jelajah = lazy(() => import('./pages/Jelajah').then((m) => ({ default: m.Jelajah })))
const VerifikasiConnect = lazy(() => import('./pages/VerifikasiConnect').then((m) => ({ default: m.VerifikasiConnect })))
const Kitab = lazy(() => import('./pages/Kitab').then((m) => ({ default: m.Kitab })))
const Hadis = lazy(() => import('./pages/Hadis').then((m) => ({ default: m.Hadis })))
const Adzan = lazy(() => import('./pages/Adzan').then((m) => ({ default: m.Adzan })))
const AturanAngka = lazy(() => import('./pages/AturanAngka').then((m) => ({ default: m.AturanAngka })))
const PapanAtlet = lazy(() => import('./pages/PapanAtlet').then((m) => ({ default: m.PapanAtlet })))
const Menyelam = lazy(() => import('./pages/Menyelam').then((m) => ({ default: m.Menyelam })))
const KisahNabi = lazy(() => import('./pages/KisahNabi').then((m) => ({ default: m.KisahNabi })))
const Perubahan = lazy(() => import('./pages/Perubahan').then((m) => ({ default: m.Perubahan })))
const Learn = lazy(() => import('./pages/Learn').then((m) => ({ default: m.Learn })))
const DekConnect = lazy(() => import('./pages/DekConnect').then((m) => ({ default: m.DekConnect })))
const TinjauConnect = lazy(() => import('./pages/TinjauConnect').then((m) => ({ default: m.TinjauConnect })))
const SunExposure = lazy(() => import('./pages/SunExposure').then((m) => ({ default: m.SunExposure })))
const MedicationReminders = lazy(() => import('./pages/MedicationReminders').then((m) => ({ default: m.MedicationReminders })))
const OttawaAnkleRules = lazy(() => import('./pages/OttawaAnkleRules').then((m) => ({ default: m.OttawaAnkleRules })))
const PsychiatricStatusExam = lazy(() => import('./pages/PsychiatricStatusExam').then((m) => ({ default: m.PsychiatricStatusExam })))
const News2Score = lazy(() => import('./pages/News2Score').then((m) => ({ default: m.News2Score })))
const AaGradient = lazy(() => import('./pages/AaGradient').then((m) => ({ default: m.AaGradient })))
const ClubHub = lazy(() => import('./pages/ClubHub').then((m) => ({ default: m.ClubHub })))
const CalculatorHub = lazy(() => import('./pages/CalculatorHub').then((m) => ({ default: m.CalculatorHub })))
const WellnessHub = lazy(() => import('./pages/WellnessHub').then((m) => ({ default: m.WellnessHub })))
const HealthSimulator = lazy(() => import('./pages/HealthSimulator').then((m) => ({ default: m.HealthSimulator })))
const SecondOpinion = lazy(() => import('./pages/SecondOpinion').then((m) => ({ default: m.SecondOpinion })))
const OrganDonorCard = lazy(() => import('./pages/OrganDonorCard').then((m) => ({ default: m.OrganDonorCard })))
const FitnessHub = lazy(() => import('./pages/FitnessHub').then((m) => ({ default: m.FitnessHub })))
const PusatLatihan = lazy(() => import('./pages/PusatLatihan').then((m) => ({ default: m.PusatLatihan })))
const PusatTubuh = lazy(() => import('./pages/PusatTubuh').then((m) => ({ default: m.PusatTubuh })))
const Ikhtisar = lazy(() => import('./pages/Ikhtisar').then((m) => ({ default: m.Ikhtisar })))
const Harian = lazy(() => import('./pages/Harian').then((m) => ({ default: m.Harian })))
const CariSemua = lazy(() => import('./pages/CariSemua').then((m) => ({ default: m.CariSemua })))
const AturFitur = lazy(() => import('./pages/AturFitur').then((m) => ({ default: m.AturFitur })))
const AnalisisPro = lazy(() => import('./pages/AnalisisPro').then((m) => ({ default: m.AnalisisPro })))
const BodyBattery = lazy(() => import('./pages/BodyBattery').then((m) => ({ default: m.BodyBattery })))
const ClinicalHub = lazy(() => import('./pages/ClinicalHub').then((m) => ({ default: m.ClinicalHub })))
const LongevityScience = lazy(() => import('./pages/LongevityScience').then((m) => ({ default: m.LongevityScience })))
const SelfAssessmentToolkit = lazy(() => import('./pages/SelfAssessmentToolkit').then((m) => ({ default: m.SelfAssessmentToolkit })))
const BodyToolkit = lazy(() => import('./pages/BodyToolkit').then((m) => ({ default: m.BodyToolkit })))
const LongevityGameCenter = lazy(() => import('./pages/LongevityGameCenter').then((m) => ({ default: m.LongevityGameCenter })))
const RppgHeartRate = lazy(() => import('./pages/RppgHeartRate').then((m) => ({ default: m.RppgHeartRate })))
const VocalBiomarkers = lazy(() => import('./pages/VocalBiomarkers').then((m) => ({ default: m.VocalBiomarkers })))
const SnpProfiler = lazy(() => import('./pages/SnpProfiler').then((m) => ({ default: m.SnpProfiler })))
const PredictiveModelsToolkit = lazy(() => import('./pages/PredictiveModelsToolkit').then((m) => ({ default: m.PredictiveModelsToolkit })))
const DataLabAdvanced = lazy(() => import('./pages/DataLabAdvanced').then((m) => ({ default: m.DataLabAdvanced })))
const BioSimulators = lazy(() => import('./pages/BioSimulators').then((m) => ({ default: m.BioSimulators })))
const DesignDemo = lazy(() => import('./pages/DesignDemo').then((m) => ({ default: m.DesignDemo })))

// Apply the saved appearance (theme, text size, motion) and language before first paint.
applyAppearance()
applyLang(getLang())
// Kamus kalimat dimuat sejak awal, bukan saat komponen pertama memerlukannya.
// Ini tidak menahan gambar pertama: yang belum siap tampil dalam bahasa Inggris
// — bahasa sumber aplikasi ini — lalu tergantikan begitu kamusnya datang.
void muatKamusKalimat(getLang()).then(umumkanBahasa)
initPwaInstall()

// Register the PWA service worker (installable + offline shell).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

/**
 * Rangka halaman, bukan pemutar berputar.
 *
 * Pemutar berputar setinggi 20 px digantikan halaman setinggi ribuan piksel
 * begitu berkasnya selesai diunduh; seluruh tata letak melompat, dan jari yang
 * sedang bergerak menuju satu tombol mendarat pada tombol lain. Rangka
 * menempati ruang yang kira-kira sama dengan halaman yang akan menggantikannya.
 */
function PageLoader() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-[30px]">
      <RangkaHalaman />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
    <StoreProvider>
      <AppStatus />
      <OfflineBanner />
      <HashRouter>
        <Shell>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/emr" element={<EMR />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/care-episode" element={<CareEpisodePage />} />
              <Route path="/my-story" element={<Navigate to="/jiwa?t=kisah" replace />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/my-materials" element={<MyMaterials />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/architecture" element={<Architecture />} />
              <Route path="/owner" element={<Owner />} />
              <Route path="/clinical" element={<Dashboard />} />
              <Route path="/social" element={<Home />} />
              <Route path="/community" element={<Community />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/semua-fitur" element={<SemuaFitur />} />
              <Route path="/ringkasan-karya" element={<RingkasanKarya />} />
              <Route path="/tutorial" element={<Tutorial />} />
              <Route path="/vitapulse" element={<VitaPulse />} />
              <Route path="/sehat-sibuk" element={<RealisticHealth />} />
              <Route path="/keuangan" element={<MoneyHub />} />
              <Route path="/alat-fitness" element={<Navigate to="/latihan?t=alat" replace />} />
              <Route path="/latihan-dasar" element={<Navigate to="/latihan?t=dasar" replace />} />
              <Route path="/lari-sepeda-renang" element={<Navigate to="/latihan?t=multisport" replace />} />
              <Route path="/notifikasi" element={<Notifications />} />
              <Route path="/sports-lab" element={<Navigate to="/latihan?t=sportlab" replace />} />
              <Route path="/connect" element={<Connect />} />
              <Route path="/macro-lab" element={<Navigate to="/gizi?t=makro" replace />} />
              <Route path="/owner-analytics" element={<OwnerAnalytics />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/fitness-test" element={<Navigate to="/latihan?t=tes" replace />} />
              <Route path="/search" element={<Search />} />
              <Route path="/logs" element={<Navigate to="/catatan?t=harian" replace />} />
              <Route path="/sports-science" element={<Navigate to="/latihan?t=sains" replace />} />
              <Route path="/training-plan" element={<Navigate to="/latihan?t=rencana" replace />} />
              <Route path="/body" element={<BodyComposition />} />
              <Route path="/lab" element={<Navigate to="/latihan?t=lab" replace />} />
              <Route path="/assessment" element={<InitialAssessment />} />
              <Route path="/readiness" element={<Readiness />} />
              <Route path="/longevity" element={<Longevity />} />
              <Route path="/organ-vitality" element={<OrganVitality />} />
              <Route path="/health-data" element={<HealthProfile />} />
              <Route path="/health-data/tutorial" element={<HealthSyncTutorial />} />
              <Route path="/sports-scores" element={<SportsScores />} />
              <Route path="/clinical-calculators" element={<ClinicalCalculators />} />
              <Route path="/longevity-curriculum" element={<LongevityCurriculum />} />
              <Route path="/med-study" element={<MedStudyHub />} />
              <Route path="/osce-ukmppd" element={<OsceUkmppd />} />
              <Route path="/supplements" element={<Navigate to="/gizi?t=suplemen" replace />} />
              <Route path="/aesthetic" element={<AestheticVitality />} />
              <Route path="/evidence" element={<Navigate to="/rujukan?t=bukti" replace />} />
              <Route path="/biological-age" element={<Navigate to="/catatan?t=usia" replace />} />
              <Route path="/reality-check" element={<RealityCheck />} />
              <Route path="/family-health" element={<FamilyHealth />} />
              <Route path="/fasting" element={<Navigate to="/tubuh?t=puasa" replace />} />
              <Route path="/lab-decoder" element={<Navigate to="/rujukan?t=lab" replace />} />
              <Route path="/emergency" element={<EmergencyCard />} />
              <Route path="/first-aid" element={<Navigate to="/rujukan?t=pertolongan" replace />} />
              <Route path="/vaccine-tracker" element={<Navigate to="/catatan?t=vaksin" replace />} />
              <Route path="/allergy-tracker" element={<Navigate to="/catatan?t=alergi" replace />} />
              <Route path="/blood-donation" element={<Navigate to="/catatan?t=donor" replace />} />
              <Route path="/second-opinion" element={<SecondOpinion />} />
              <Route path="/visit-prep" element={<Navigate to="/catatan?t=kunjungan" replace />} />
              <Route path="/posture-breaks" element={<Navigate to="/tubuh?t=postur" replace />} />
              <Route path="/pain-diary" element={<Navigate to="/catatan?t=nyeri" replace />} />
              <Route path="/organ-donor" element={<OrganDonorCard />} />
              <Route path="/fitness-hub" element={<FitnessHub />} />
              <Route path="/latihan" element={<PusatLatihan />} />
              <Route path="/tubuh" element={<PusatTubuh />} />
              <Route path="/ikhtisar" element={<Ikhtisar />} />
              <Route path="/harian" element={<Harian />} />
              <Route path="/cari" element={<CariSemua />} />
              <Route path="/latihan-beban" element={<Navigate to="/latihan?t=beban" replace />} />
              <Route path="/atur-fitur" element={<AturFitur />} />
              {/* Rute lama tetap hidup dan mengalihkan ke tab yang tepat, agar
                  penanda halaman dan tautan lama tidak ada yang putus. */}
              <Route path="/riwayat-latihan" element={<Navigate to="/latihan?t=pelatih" replace />} />
              <Route path="/fisiologi-latihan" element={<Navigate to="/latihan?t=fisiologi" replace />} />
              <Route path="/alat-endurance" element={<Navigate to="/latihan?t=endurance" replace />} />
              <Route path="/body-battery" element={<Navigate to="/tubuh?t=energi" replace />} />
              <Route path="/log-detak-jantung" element={<Navigate to="/tubuh?t=jantung" replace />} />
              <Route path="/pola-tidur" element={<Navigate to="/tubuh?t=tidur" replace />} />
              <Route path="/analisis-gerak" element={<Navigate to="/tubuh?t=gerak" replace />} />
              <Route path="/pelacak-klinis" element={<Navigate to="/tubuh?t=klinis" replace />} />
              <Route path="/how-numbers-work" element={<AturanAngka />} />
              <Route path="/calisthenics" element={<Navigate to="/latihan?t=kalistenik" replace />} />
              <Route path="/athlete-board" element={<PapanAtlet />} />
              <Route path="/dive-log" element={<Menyelam />} />
              <Route path="/prophet-stories" element={<KisahNabi />} />
              <Route path="/recomposition" element={<Navigate to="/latihan?t=rekomposisi" replace />} />
              <Route path="/health-explained" element={<Navigate to="/rujukan?t=awam" replace />} />
              <Route path="/analisis-pro" element={<Navigate to="/latihan?t=analisis" replace />} />
              <Route path="/clinical-hub" element={<ClinicalHub />} />
              <Route path="/sleep-toolkit" element={<Navigate to="/tubuh?t=alat-tidur" replace />} />
              <Route path="/movement-toolkit" element={<Navigate to="/latihan?t=gerak" replace />} />
              <Route path="/mind-toolkit" element={<Navigate to="/jiwa?t=alat" replace />} />
              <Route path="/nutrition-toolkit" element={<Navigate to="/gizi?t=alat" replace />} />
              <Route path="/toxin-checklist" element={<Navigate to="/catatan?t=paparan" replace />} />
              <Route path="/longevity-science" element={<LongevityScience />} />
              <Route path="/self-assessment-toolkit" element={<SelfAssessmentToolkit />} />
              <Route path="/body-toolkit" element={<BodyToolkit />} />
              <Route path="/longevity-game-center" element={<LongevityGameCenter />} />
              <Route path="/rppg-heart-rate" element={<RppgHeartRate />} />
              <Route path="/vocal-biomarkers" element={<VocalBiomarkers />} />
              <Route path="/snp-profiler" element={<SnpProfiler />} />
              <Route path="/predictive-models-toolkit" element={<PredictiveModelsToolkit />} />
              <Route path="/data-lab-advanced" element={<DataLabAdvanced />} />
              <Route path="/bio-simulators" element={<BioSimulators />} />
              <Route path="/risk" element={<Navigate to="/clinical-scores?s=risiko" replace />} />
              <Route path="/air-quality" element={<AirQuality />} />
              <Route path="/data-lab" element={<DataLab />} />
              <Route path="/drug-info" element={<Navigate to="/rujukan?t=obat" replace />} />
              <Route path="/gene-info" element={<GeneInfo />} />
              <Route path="/ikigai" element={<Navigate to="/jiwa?t=ikigai" replace />} />
              <Route path="/harada" element={<Harada />} />
              <Route path="/crossfit" element={<Navigate to="/latihan?t=crossfit" replace />} />
              <Route path="/peregangan" element={<Navigate to="/latihan?t=peregangan" replace />} />
              <Route path="/jelajah" element={<Jelajah />} />
              <Route path="/teknik-lari" element={<Navigate to="/latihan?t=lari" replace />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/change" element={<Perubahan />} />
              <Route path="/scripture" element={<Kitab />} />
              <Route path="/hadith" element={<Hadis />} />
              <Route path="/prayer-times" element={<Adzan />} />
              <Route path="/dek-connect" element={<DekConnect />} />
              <Route path="/verifikasi-connect" element={<VerifikasiConnect />} />
              <Route path="/tinjau-connect" element={<TinjauConnect />} />
              <Route path="/carbon-diet" element={<Navigate to="/gizi?t=jejak" replace />} />
              <Route path="/caffeine" element={<Navigate to="/gizi?t=kafein" replace />} />
              <Route path="/hydration" element={<Navigate to="/gizi?t=cairan" replace />} />
              <Route path="/alcohol" element={<Navigate to="/gizi?t=alkohol" replace />} />
              <Route path="/sun-exposure" element={<SunExposure />} />
              <Route path="/med-reminders" element={<MedicationReminders />} />
              <Route path="/chronotype" element={<Navigate to="/tubuh?t=kronotipe" replace />} />
              <Route path="/sleep-apnea-screen" element={<Navigate to="/tubuh?t=apnea" replace />} />
              <Route path="/mental-health-screen" element={<Navigate to="/jiwa?t=saring" replace />} />
              <Route path="/substance-use-screen" element={<Navigate to="/jiwa?t=zat" replace />} />
              <Route path="/epworth-sleepiness" element={<Navigate to="/clinical-scores?s=epworth" replace />} />
              <Route path="/stroke-risk" element={<Navigate to="/clinical-scores?s=stroke-risk" replace />} />
              <Route path="/wells-score" element={<Navigate to="/clinical-scores?s=wells" replace />} />
              <Route path="/ottawa-ankle" element={<OttawaAnkleRules />} />
              <Route path="/child-growth" element={<Navigate to="/catatan?t=tumbuh" replace />} />
              <Route path="/qtc-calculator" element={<Navigate to="/clinical-scores?s=qtc" replace />} />
              <Route path="/creatinine-clearance" element={<Navigate to="/clinical-scores?s=creatinine-clearance" replace />} />
              <Route path="/corrected-calcium" element={<Navigate to="/clinical-scores?s=corrected-calcium" replace />} />
              <Route path="/meld-score" element={<Navigate to="/clinical-scores?s=meld" replace />} />
              <Route path="/child-pugh-score" element={<Navigate to="/clinical-scores?s=child-pugh" replace />} />
              <Route path="/fena-calculator" element={<Navigate to="/clinical-scores?s=fena" replace />} />
              <Route path="/pediatric-dka-calculator" element={<Navigate to="/clinical-scores?s=dka-anak" replace />} />
              <Route path="/fluid-calculators" element={<Navigate to="/clinical-scores?s=fluid" replace />} />
              <Route path="/neonatal-resuscitation-guide" element={<Navigate to="/rujukan?t=neonatus" replace />} />
              <Route path="/empiric-therapy-reference" element={<Navigate to="/rujukan?t=empiris" replace />} />
              <Route path="/dermatology-lesion-mapper" element={<Navigate to="/catatan?t=kulit" replace />} />
              <Route path="/psychiatric-status-exam" element={<PsychiatricStatusExam />} />
              <Route path="/ranson-criteria" element={<Navigate to="/clinical-scores?s=ranson" replace />} />
              <Route path="/has-bled-score" element={<Navigate to="/clinical-scores?s=hasbled" replace />} />
              <Route path="/bisap-score" element={<Navigate to="/clinical-scores?s=bisap" replace />} />
              <Route path="/glasgow-blatchford-score" element={<Navigate to="/clinical-scores?s=blatchford" replace />} />
              <Route path="/timi-risk-score" element={<Navigate to="/clinical-scores?s=timi" replace />} />
              <Route path="/perc-rule" element={<Navigate to="/clinical-scores?s=perc" replace />} />
              <Route path="/sofa-score" element={<Navigate to="/clinical-scores?s=sofa" replace />} />
              <Route path="/lights-criteria" element={<Navigate to="/clinical-scores?s=lights" replace />} />
              <Route path="/4ts-score" element={<Navigate to="/clinical-scores?s=4ts" replace />} />
              <Route path="/news2-score" element={<News2Score />} />
              <Route path="/serum-osmolality" element={<Navigate to="/clinical-scores?s=serum-osmolality" replace />} />
              <Route path="/ldl-calculator" element={<Navigate to="/clinical-scores?s=ldl" replace />} />
              <Route path="/aa-gradient" element={<AaGradient />} />
              <Route path="/padua-score" element={<Navigate to="/clinical-scores?s=padua" replace />} />
              <Route path="/rockall-score" element={<Navigate to="/clinical-scores?s=rockall" replace />} />
              <Route path="/charlson-index" element={<Navigate to="/clinical-scores?s=charlson" replace />} />
              <Route path="/caprini-score" element={<Navigate to="/clinical-scores?s=caprini" replace />} />
              <Route path="/duke-criteria" element={<Navigate to="/clinical-scores?s=duke" replace />} />
              <Route path="/braden-scale" element={<Navigate to="/clinical-scores?s=braden" replace />} />
              <Route path="/grace-score" element={<Navigate to="/clinical-scores?s=grace" replace />} />
              <Route path="/clubs" element={<ClubHub />} />
              <Route path="/calculator-hub" element={<CalculatorHub />} />
              <Route path="/wellness-hub" element={<WellnessHub />} />
              <Route path="/health-simulator" element={<HealthSimulator />} />
              <Route path="/findrisc" element={<Navigate to="/clinical-scores?s=findrisc" replace />} />
              <Route path="/maddrey-score" element={<Navigate to="/clinical-scores?s=maddrey" replace />} />
              <Route path="/resilience-stories" element={<Navigate to="/jiwa?t=ketahanan" replace />} />
              <Route path="/life-compass" element={<Navigate to="/jiwa?t=arah" replace />} />
              <Route path="/breathwork" element={<Navigate to="/tubuh?t=napas" replace />} />
              <Route path="/gratitude" element={<Navigate to="/jiwa?t=syukur" replace />} />
              <Route path="/sleep-debt" element={<Navigate to="/tubuh?t=utang-tidur" replace />} />
              <Route path="/thermal-therapy" element={<Navigate to="/tubuh?t=termal" replace />} />
              <Route path="/trials" element={<Navigate to="/rujukan?t=uji" replace />} />
              <Route path="/nutrition" element={<Navigate to="/gizi?t=makan" replace />} />
              <Route path="/body-explorer" element={<BodyExplorer />} />
              <Route path="/translator" element={<Translator />} />
              {/* Dua puluh satu skor klinis yang dulu punya rute sendiri kini
                  digabung ke satu halaman. Rute lamanya SENGAJA dipertahankan
                  sebagai pengalihan supaya tautan yang sudah tersebar — di
                  catatan, pesan, maupun penanda — tidak mati. */}
              <Route path="/clinical-scores" element={<ClinicalScores />} />
              <Route path="/gizi" element={<PusatGizi />} />
              <Route path="/jiwa" element={<PusatJiwa />} />
              <Route path="/catatan" element={<PusatCatatan />} />
              <Route path="/rujukan" element={<PusatRujukan />} />
              <Route path="/athlete" element={<Athlete />} />
              <Route path="/recovery" element={<Navigate to="/tubuh?t=pulih" replace />} />
              <Route path="/workout" element={<Navigate to="/latihan?t=sesi" replace />} />
              <Route path="/sexual-health" element={<SexualHealth />} />
              <Route path="/shape-forming" element={<Navigate to="/latihan?t=bentuk" replace />} />
              <Route path="/consult" element={<Consult />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/education" element={<Navigate to="/rujukan?t=edukasi" replace />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/legal" element={<Legal />} />
              {/* Halaman demo terisolasi, sengaja tidak ditautkan dari navigasi mana pun. */}
              <Route path="/design-demo" element={<DesignDemo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Shell>
      </HashRouter>
    </StoreProvider>
    </ErrorBoundary>
  </StrictMode>,
)

// Dismiss the inline splash screen once the app has painted — floored at
// 500ms so it never flashes imperceptibly on a fast connection.
const SPLASH_MIN_MS = 500
const splashShownAt = performance.now()
requestAnimationFrame(() => {
  const splash = document.getElementById('pmd-splash')
  if (!splash) return
  const wait = Math.max(0, SPLASH_MIN_MS - (performance.now() - splashShownAt))
  setTimeout(() => {
    splash.style.opacity = '0'
    setTimeout(() => splash.remove(), 450)
  }, wait)
})
