import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PhysiologyLab } from '../src/components/physiology/PhysiologyLab'
import '../src/index.css'

if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><PhysiologyLab /></BrowserRouter></React.StrictMode>)
