import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { applyAppearance } from './lib/theme'
import { applyLang, getLang } from './lib/i18n'
import { initPwaInstall } from './lib/pwa'
import { StoreProvider } from './lib/store'
import { Shell } from './components/Shell'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AppStatus } from './components/AppStatus'
import { OfflineBanner } from './components/OfflineBanner'
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))
const Chatbot = lazy(() => import('./pages/Chatbot').then((m) => ({ default: m.Chatbot })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const Nutrition = lazy(() => import('./pages/Nutrition').then((m) => ({ default: m.Nutrition })))
const Consult = lazy(() => import('./pages/Consult').then((m) => ({ default: m.Consult })))
const Hospitals = lazy(() => import('./pages/Hospitals').then((m) => ({ default: m.Hospitals })))
const Pharmacy = lazy(() => import('./pages/Pharmacy').then((m) => ({ default: m.Pharmacy })))
const Orders = lazy(() => import('./pages/Orders').then((m) => ({ default: m.Orders })))
const PatientEducation = lazy(() => import('./pages/PatientEducation').then((m) => ({ default: m.PatientEducation })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))

// Lazy-load role-specific / heavier secondary pages so the initial bundle stays
// small; they're fetched on demand when first navigated to.
const Athlete = lazy(() => import('./pages/Athlete').then((m) => ({ default: m.Athlete })))
const Recovery = lazy(() => import('./pages/Recovery').then((m) => ({ default: m.Recovery })))
const Workout = lazy(() => import('./pages/Workout').then((m) => ({ default: m.Workout })))
const SexualHealth = lazy(() => import('./pages/SexualHealth').then((m) => ({ default: m.SexualHealth })))
const ShapeForming = lazy(() => import('./pages/ShapeForming').then((m) => ({ default: m.ShapeForming })))
const EMR = lazy(() => import('./pages/EMR').then((m) => ({ default: m.EMR })))
const Planning = lazy(() => import('./pages/Planning').then((m) => ({ default: m.Planning })))
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
const VitaPulse = lazy(() => import('./pages/VitaPulse').then((m) => ({ default: m.VitaPulse })))
const Messages = lazy(() => import('./pages/Messages').then((m) => ({ default: m.Messages })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const FitnessTest = lazy(() => import('./pages/FitnessTest').then((m) => ({ default: m.FitnessTest })))
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })))
const Logs = lazy(() => import('./pages/Logs').then((m) => ({ default: m.Logs })))
const SportsScience = lazy(() => import('./pages/SportsScience').then((m) => ({ default: m.SportsScience })))
const TrainingPlan = lazy(() => import('./pages/TrainingPlan').then((m) => ({ default: m.TrainingPlan })))
const BodyComposition = lazy(() => import('./pages/BodyComposition').then((m) => ({ default: m.BodyComposition })))
const PerformanceLab = lazy(() => import('./pages/PerformanceLab').then((m) => ({ default: m.PerformanceLab })))
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
const DietarySupplements = lazy(() => import('./pages/DietarySupplements').then((m) => ({ default: m.DietarySupplements })))
const AestheticVitality = lazy(() => import('./pages/AestheticVitality').then((m) => ({ default: m.AestheticVitality })))
const ClinicalEvidence = lazy(() => import('./pages/ClinicalEvidence').then((m) => ({ default: m.ClinicalEvidence })))
const BiologicalAge = lazy(() => import('./pages/BiologicalAge').then((m) => ({ default: m.BiologicalAge })))
const RealityCheck = lazy(() => import('./pages/RealityCheck').then((m) => ({ default: m.RealityCheck })))
const FamilyHealth = lazy(() => import('./pages/FamilyHealth').then((m) => ({ default: m.FamilyHealth })))
const FastingTimer = lazy(() => import('./pages/FastingTimer').then((m) => ({ default: m.FastingTimer })))
const LabDecoder = lazy(() => import('./pages/LabDecoder').then((m) => ({ default: m.LabDecoder })))
const EmergencyCard = lazy(() => import('./pages/EmergencyCard').then((m) => ({ default: m.EmergencyCard })))
const RiskCalculators = lazy(() => import('./pages/RiskCalculators').then((m) => ({ default: m.RiskCalculators })))
const AirQuality = lazy(() => import('./pages/AirQuality').then((m) => ({ default: m.AirQuality })))
const DataLab = lazy(() => import('./pages/DataLab').then((m) => ({ default: m.DataLab })))
const DrugInfo = lazy(() => import('./pages/DrugInfo').then((m) => ({ default: m.DrugInfo })))
const GeneInfo = lazy(() => import('./pages/GeneInfo').then((m) => ({ default: m.GeneInfo })))
const Ikigai = lazy(() => import('./pages/Ikigai').then((m) => ({ default: m.Ikigai })))
const CarbonDiet = lazy(() => import('./pages/CarbonDiet').then((m) => ({ default: m.CarbonDiet })))
const CaffeineCalculator = lazy(() => import('./pages/CaffeineCalculator').then((m) => ({ default: m.CaffeineCalculator })))
const HydrationCalculator = lazy(() => import('./pages/HydrationCalculator').then((m) => ({ default: m.HydrationCalculator })))
const AlcoholCalculator = lazy(() => import('./pages/AlcoholCalculator').then((m) => ({ default: m.AlcoholCalculator })))
const SunExposure = lazy(() => import('./pages/SunExposure').then((m) => ({ default: m.SunExposure })))
const MedicationReminders = lazy(() => import('./pages/MedicationReminders').then((m) => ({ default: m.MedicationReminders })))
const Chronotype = lazy(() => import('./pages/Chronotype').then((m) => ({ default: m.Chronotype })))
const SleepApneaScreen = lazy(() => import('./pages/SleepApneaScreen').then((m) => ({ default: m.SleepApneaScreen })))
const MentalHealthScreen = lazy(() => import('./pages/MentalHealthScreen').then((m) => ({ default: m.MentalHealthScreen })))
const SubstanceUseScreen = lazy(() => import('./pages/SubstanceUseScreen').then((m) => ({ default: m.SubstanceUseScreen })))
const EpworthSleepiness = lazy(() => import('./pages/EpworthSleepiness').then((m) => ({ default: m.EpworthSleepiness })))
const StrokeRiskCalculator = lazy(() => import('./pages/StrokeRiskCalculator').then((m) => ({ default: m.StrokeRiskCalculator })))
const WellsScore = lazy(() => import('./pages/WellsScore').then((m) => ({ default: m.WellsScore })))
const OttawaAnkleRules = lazy(() => import('./pages/OttawaAnkleRules').then((m) => ({ default: m.OttawaAnkleRules })))
const ChildGrowthTracker = lazy(() => import('./pages/ChildGrowthTracker').then((m) => ({ default: m.ChildGrowthTracker })))
const QTcCalculator = lazy(() => import('./pages/QTcCalculator').then((m) => ({ default: m.QTcCalculator })))
const CreatinineClearance = lazy(() => import('./pages/CreatinineClearance').then((m) => ({ default: m.CreatinineClearance })))
const CorrectedCalcium = lazy(() => import('./pages/CorrectedCalcium').then((m) => ({ default: m.CorrectedCalcium })))
const MeldScore = lazy(() => import('./pages/MeldScore').then((m) => ({ default: m.MeldScore })))
const ChildPughScore = lazy(() => import('./pages/ChildPughScore').then((m) => ({ default: m.ChildPughScore })))
const FenaCalculator = lazy(() => import('./pages/FenaCalculator').then((m) => ({ default: m.FenaCalculator })))
const RansonCriteria = lazy(() => import('./pages/RansonCriteria').then((m) => ({ default: m.RansonCriteria })))
const HasBledScore = lazy(() => import('./pages/HasBledScore').then((m) => ({ default: m.HasBledScore })))
const BisapScore = lazy(() => import('./pages/BisapScore').then((m) => ({ default: m.BisapScore })))
const GlasgowBlatchfordScore = lazy(() => import('./pages/GlasgowBlatchfordScore').then((m) => ({ default: m.GlasgowBlatchfordScore })))
const TimiRiskScore = lazy(() => import('./pages/TimiRiskScore').then((m) => ({ default: m.TimiRiskScore })))
const PercRule = lazy(() => import('./pages/PercRule').then((m) => ({ default: m.PercRule })))
const SofaScore = lazy(() => import('./pages/SofaScore').then((m) => ({ default: m.SofaScore })))
const LightsCriteria = lazy(() => import('./pages/LightsCriteria').then((m) => ({ default: m.LightsCriteria })))
const FourTsScore = lazy(() => import('./pages/FourTsScore').then((m) => ({ default: m.FourTsScore })))
const News2Score = lazy(() => import('./pages/News2Score').then((m) => ({ default: m.News2Score })))
const SerumOsmolality = lazy(() => import('./pages/SerumOsmolality').then((m) => ({ default: m.SerumOsmolality })))
const LdlCalculator = lazy(() => import('./pages/LdlCalculator').then((m) => ({ default: m.LdlCalculator })))
const AaGradient = lazy(() => import('./pages/AaGradient').then((m) => ({ default: m.AaGradient })))
const PaduaScore = lazy(() => import('./pages/PaduaScore').then((m) => ({ default: m.PaduaScore })))
const RockallScore = lazy(() => import('./pages/RockallScore').then((m) => ({ default: m.RockallScore })))
const CharlsonIndex = lazy(() => import('./pages/CharlsonIndex').then((m) => ({ default: m.CharlsonIndex })))
const CapriniScore = lazy(() => import('./pages/CapriniScore').then((m) => ({ default: m.CapriniScore })))
const DukeCriteria = lazy(() => import('./pages/DukeCriteria').then((m) => ({ default: m.DukeCriteria })))
const BradenScale = lazy(() => import('./pages/BradenScale').then((m) => ({ default: m.BradenScale })))
const GraceScore = lazy(() => import('./pages/GraceScore').then((m) => ({ default: m.GraceScore })))
const ClubHub = lazy(() => import('./pages/ClubHub').then((m) => ({ default: m.ClubHub })))
const CalculatorHub = lazy(() => import('./pages/CalculatorHub').then((m) => ({ default: m.CalculatorHub })))
const WellnessHub = lazy(() => import('./pages/WellnessHub').then((m) => ({ default: m.WellnessHub })))
const HealthSimulator = lazy(() => import('./pages/HealthSimulator').then((m) => ({ default: m.HealthSimulator })))
const Findrisc = lazy(() => import('./pages/Findrisc').then((m) => ({ default: m.Findrisc })))
const MaddreyScore = lazy(() => import('./pages/MaddreyScore').then((m) => ({ default: m.MaddreyScore })))
const ResilienceStories = lazy(() => import('./pages/ResilienceStories').then((m) => ({ default: m.ResilienceStories })))
const LifeCompass = lazy(() => import('./pages/LifeCompass').then((m) => ({ default: m.LifeCompass })))
const Breathwork = lazy(() => import('./pages/Breathwork').then((m) => ({ default: m.Breathwork })))
const GratitudeJournal = lazy(() => import('./pages/GratitudeJournal').then((m) => ({ default: m.GratitudeJournal })))
const SleepDebt = lazy(() => import('./pages/SleepDebt').then((m) => ({ default: m.SleepDebt })))
const ThermalTherapy = lazy(() => import('./pages/ThermalTherapy').then((m) => ({ default: m.ThermalTherapy })))
const ClinicalTrials = lazy(() => import('./pages/ClinicalTrials').then((m) => ({ default: m.ClinicalTrials })))
const FirstAidGuide = lazy(() => import('./pages/FirstAidGuide').then((m) => ({ default: m.FirstAidGuide })))
const VaccineTracker = lazy(() => import('./pages/VaccineTracker').then((m) => ({ default: m.VaccineTracker })))
const BloodDonation = lazy(() => import('./pages/BloodDonation').then((m) => ({ default: m.BloodDonation })))
const SecondOpinion = lazy(() => import('./pages/SecondOpinion').then((m) => ({ default: m.SecondOpinion })))
const VisitPrepChecklist = lazy(() => import('./pages/VisitPrepChecklist').then((m) => ({ default: m.VisitPrepChecklist })))
const PostureBreaks = lazy(() => import('./pages/PostureBreaks').then((m) => ({ default: m.PostureBreaks })))
const PainDiary = lazy(() => import('./pages/PainDiary').then((m) => ({ default: m.PainDiary })))
const OrganDonorCard = lazy(() => import('./pages/OrganDonorCard').then((m) => ({ default: m.OrganDonorCard })))
const FitnessHub = lazy(() => import('./pages/FitnessHub').then((m) => ({ default: m.FitnessHub })))
const SleepToolkit = lazy(() => import('./pages/SleepToolkit').then((m) => ({ default: m.SleepToolkit })))
const MovementToolkit = lazy(() => import('./pages/MovementToolkit').then((m) => ({ default: m.MovementToolkit })))
const MindToolkit = lazy(() => import('./pages/MindToolkit').then((m) => ({ default: m.MindToolkit })))
const NutritionToolkit = lazy(() => import('./pages/NutritionToolkit').then((m) => ({ default: m.NutritionToolkit })))
const ToxinChecklist = lazy(() => import('./pages/ToxinChecklist').then((m) => ({ default: m.ToxinChecklist })))
const LongevityScience = lazy(() => import('./pages/LongevityScience').then((m) => ({ default: m.LongevityScience })))
const SelfAssessmentToolkit = lazy(() => import('./pages/SelfAssessmentToolkit').then((m) => ({ default: m.SelfAssessmentToolkit })))
const BodyToolkit = lazy(() => import('./pages/BodyToolkit').then((m) => ({ default: m.BodyToolkit })))
const LongevityGameCenter = lazy(() => import('./pages/LongevityGameCenter').then((m) => ({ default: m.LongevityGameCenter })))

// Apply the saved appearance (theme, text size, motion) and language before first paint.
applyAppearance()
applyLang(getLang())
initPwaInstall()

// Register the PWA service worker (installable + offline shell).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-neutral-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
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
              <Route path="/vitapulse" element={<VitaPulse />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/fitness-test" element={<FitnessTest />} />
              <Route path="/search" element={<Search />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/sports-science" element={<SportsScience />} />
              <Route path="/training-plan" element={<TrainingPlan />} />
              <Route path="/body" element={<BodyComposition />} />
              <Route path="/lab" element={<PerformanceLab />} />
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
              <Route path="/supplements" element={<DietarySupplements />} />
              <Route path="/aesthetic" element={<AestheticVitality />} />
              <Route path="/evidence" element={<ClinicalEvidence />} />
              <Route path="/biological-age" element={<BiologicalAge />} />
              <Route path="/reality-check" element={<RealityCheck />} />
              <Route path="/family-health" element={<FamilyHealth />} />
              <Route path="/fasting" element={<FastingTimer />} />
              <Route path="/lab-decoder" element={<LabDecoder />} />
              <Route path="/emergency" element={<EmergencyCard />} />
              <Route path="/first-aid" element={<FirstAidGuide />} />
              <Route path="/vaccine-tracker" element={<VaccineTracker />} />
              <Route path="/blood-donation" element={<BloodDonation />} />
              <Route path="/second-opinion" element={<SecondOpinion />} />
              <Route path="/visit-prep" element={<VisitPrepChecklist />} />
              <Route path="/posture-breaks" element={<PostureBreaks />} />
              <Route path="/pain-diary" element={<PainDiary />} />
              <Route path="/organ-donor" element={<OrganDonorCard />} />
              <Route path="/fitness-hub" element={<FitnessHub />} />
              <Route path="/sleep-toolkit" element={<SleepToolkit />} />
              <Route path="/movement-toolkit" element={<MovementToolkit />} />
              <Route path="/mind-toolkit" element={<MindToolkit />} />
              <Route path="/nutrition-toolkit" element={<NutritionToolkit />} />
              <Route path="/toxin-checklist" element={<ToxinChecklist />} />
              <Route path="/longevity-science" element={<LongevityScience />} />
              <Route path="/self-assessment-toolkit" element={<SelfAssessmentToolkit />} />
              <Route path="/body-toolkit" element={<BodyToolkit />} />
              <Route path="/longevity-game-center" element={<LongevityGameCenter />} />
              <Route path="/risk" element={<RiskCalculators />} />
              <Route path="/air-quality" element={<AirQuality />} />
              <Route path="/data-lab" element={<DataLab />} />
              <Route path="/drug-info" element={<DrugInfo />} />
              <Route path="/gene-info" element={<GeneInfo />} />
              <Route path="/ikigai" element={<Ikigai />} />
              <Route path="/carbon-diet" element={<CarbonDiet />} />
              <Route path="/caffeine" element={<CaffeineCalculator />} />
              <Route path="/hydration" element={<HydrationCalculator />} />
              <Route path="/alcohol" element={<AlcoholCalculator />} />
              <Route path="/sun-exposure" element={<SunExposure />} />
              <Route path="/med-reminders" element={<MedicationReminders />} />
              <Route path="/chronotype" element={<Chronotype />} />
              <Route path="/sleep-apnea-screen" element={<SleepApneaScreen />} />
              <Route path="/mental-health-screen" element={<MentalHealthScreen />} />
              <Route path="/substance-use-screen" element={<SubstanceUseScreen />} />
              <Route path="/epworth-sleepiness" element={<EpworthSleepiness />} />
              <Route path="/stroke-risk" element={<StrokeRiskCalculator />} />
              <Route path="/wells-score" element={<WellsScore />} />
              <Route path="/ottawa-ankle" element={<OttawaAnkleRules />} />
              <Route path="/child-growth" element={<ChildGrowthTracker />} />
              <Route path="/qtc-calculator" element={<QTcCalculator />} />
              <Route path="/creatinine-clearance" element={<CreatinineClearance />} />
              <Route path="/corrected-calcium" element={<CorrectedCalcium />} />
              <Route path="/meld-score" element={<MeldScore />} />
              <Route path="/child-pugh-score" element={<ChildPughScore />} />
              <Route path="/fena-calculator" element={<FenaCalculator />} />
              <Route path="/ranson-criteria" element={<RansonCriteria />} />
              <Route path="/has-bled-score" element={<HasBledScore />} />
              <Route path="/bisap-score" element={<BisapScore />} />
              <Route path="/glasgow-blatchford-score" element={<GlasgowBlatchfordScore />} />
              <Route path="/timi-risk-score" element={<TimiRiskScore />} />
              <Route path="/perc-rule" element={<PercRule />} />
              <Route path="/sofa-score" element={<SofaScore />} />
              <Route path="/lights-criteria" element={<LightsCriteria />} />
              <Route path="/4ts-score" element={<FourTsScore />} />
              <Route path="/news2-score" element={<News2Score />} />
              <Route path="/serum-osmolality" element={<SerumOsmolality />} />
              <Route path="/ldl-calculator" element={<LdlCalculator />} />
              <Route path="/aa-gradient" element={<AaGradient />} />
              <Route path="/padua-score" element={<PaduaScore />} />
              <Route path="/rockall-score" element={<RockallScore />} />
              <Route path="/charlson-index" element={<CharlsonIndex />} />
              <Route path="/caprini-score" element={<CapriniScore />} />
              <Route path="/duke-criteria" element={<DukeCriteria />} />
              <Route path="/braden-scale" element={<BradenScale />} />
              <Route path="/grace-score" element={<GraceScore />} />
              <Route path="/clubs" element={<ClubHub />} />
              <Route path="/calculator-hub" element={<CalculatorHub />} />
              <Route path="/wellness-hub" element={<WellnessHub />} />
              <Route path="/health-simulator" element={<HealthSimulator />} />
              <Route path="/findrisc" element={<Findrisc />} />
              <Route path="/maddrey-score" element={<MaddreyScore />} />
              <Route path="/resilience-stories" element={<ResilienceStories />} />
              <Route path="/life-compass" element={<LifeCompass />} />
              <Route path="/breathwork" element={<Breathwork />} />
              <Route path="/gratitude" element={<GratitudeJournal />} />
              <Route path="/sleep-debt" element={<SleepDebt />} />
              <Route path="/thermal-therapy" element={<ThermalTherapy />} />
              <Route path="/trials" element={<ClinicalTrials />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/athlete" element={<Athlete />} />
              <Route path="/recovery" element={<Recovery />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/sexual-health" element={<SexualHealth />} />
              <Route path="/shape-forming" element={<ShapeForming />} />
              <Route path="/consult" element={<Consult />} />
              <Route path="/hospitals" element={<Hospitals />} />
              <Route path="/pharmacy" element={<Pharmacy />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/education" element={<PatientEducation />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/legal" element={<Legal />} />
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
