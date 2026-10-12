import React from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { EnduranceTools } from '../src/pages/fitness/EnduranceTools'
import '../src/index.css'

if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<React.StrictMode><MemoryRouter><EnduranceTools /></MemoryRouter></React.StrictMode>)
