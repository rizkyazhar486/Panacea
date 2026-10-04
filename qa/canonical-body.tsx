import React from 'react'
import { createRoot } from 'react-dom/client'
import { CanonicalBody } from '../src/pages/CanonicalBody'
import '../src/index.css'

if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<React.StrictMode><CanonicalBody /></React.StrictMode>)
