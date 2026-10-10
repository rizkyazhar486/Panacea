import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StoreProvider } from '../src/lib/store'
import { DoctorBodyReview } from '../src/pages/DoctorBodyReview'
import '../src/index.css'

// Halaman uji: dokter/pemilik dibaca dari sesi di localStorage (diisi oleh qa/doctor-body-review-check.mjs)
if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<React.StrictMode><MemoryRouter><StoreProvider><DoctorBodyReview /></StoreProvider></MemoryRouter></React.StrictMode>)
