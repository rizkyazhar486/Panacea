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
import { Home } from './pages/Home'
import { NotFound } from './pages/NotFound'
import { Chatbot } from './pages/Chatbot'
import { Dashboard } from './pages/Dashboard'
import { Nutrition } from './pages/Nutrition'
import { Consult } from './pages/Consult'
import { Hospitals } from './pages/Hospitals'
import { Pharmacy } from './pages/Pharmacy'
import { Orders } from './pages/Orders'
import { PatientEducation } from './pages/PatientEducation'
import { Settings } from './pages/Settings'

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
