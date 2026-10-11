import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StoreProvider } from '../src/lib/store'
import { LabResultReview } from '../src/pages/LabResultReview'
import '../src/index.css'

// Halaman uji: sesi dan token dibaca dari localStorage (diisi oleh qa/lab-result-review-check.mjs terhadap server nyata)
if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<React.StrictMode><MemoryRouter><StoreProvider><LabResultReview /></StoreProvider></MemoryRouter></React.StrictMode>)
