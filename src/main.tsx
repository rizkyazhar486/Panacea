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
              <Route path="/nutrition" element={<Nutrition />} />
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
