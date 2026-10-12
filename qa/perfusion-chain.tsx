import React from 'react'
import { createRoot } from 'react-dom/client'
import { PerfusionChainPanel } from '../src/domains/body-exposure/ui/PerfusionChainPanel'
import '../src/index.css'

if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<React.StrictMode><PerfusionChainPanel /></React.StrictMode>)
