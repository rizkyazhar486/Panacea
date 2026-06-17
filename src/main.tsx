import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { StoreProvider } from './lib/store'
import { Shell } from './components/Shell'
import { Dashboard } from './pages/Dashboard'
import { Chatbot } from './pages/Chatbot'
import { EMR } from './pages/EMR'
import { Planning } from './pages/Planning'
import { Marketplace } from './pages/Marketplace'
import { Verification } from './pages/Verification'
import { Billing } from './pages/Billing'
import { Settings } from './pages/Settings'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/emr" element={<EMR />} />
            <Route path="/planning" element={<Planning />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
)
