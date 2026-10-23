import React from 'react'
import { createRoot } from 'react-dom/client'
import { RencanaHarianDokter } from '../../src/components/clinical/RencanaHarianDokter'
import '../../src/index.css'
const share = new URLSearchParams(location.search).get('share') ?? ''
if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(
  <main className="min-h-screen bg-neutral-950 p-4 text-white"><RencanaHarianDokter izinId={share} /></main>,
)
