import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { StoreProvider } from './lib/store'
import { Shell } from './components/Shell'
import { Home } from './pages/Home'
import { Chatbot } from './pages/Chatbot'
import { EMR } from './pages/EMR'
import { Planning } from './pages/Planning'
import { Marketplace } from './pages/Marketplace'
import { MyMaterials } from './pages/MyMaterials'
import { Verification } from './pages/Verification'
import { Billing } from './pages/Billing'
import { Architecture } from './pages/Architecture'
import { Settings } from './pages/Settings'
import { Owner } from './pages/Owner'
import { Social } from './pages/Social'
import { Nutrition } from './pages/Nutrition'
import { Consult } from './pages/Consult'
import { Hospitals } from './pages/Hospitals'
import { Editor } from './pages/Editor'
import { PatientEducation } from './pages/PatientEducation'
import { Admin } from './pages/Admin'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <HashRouter>
        <Shell>
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
            <Route path="/social" element={<Social />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/consult" element={<Consult />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/education" element={<PatientEducation />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Shell>
      </HashRouter>
    </StoreProvider>
  </StrictMode>,
)
