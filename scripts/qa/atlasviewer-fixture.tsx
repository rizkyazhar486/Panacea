import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import AtlasViewer3D from '../../src/components/bodyhub/AtlasViewer3D'
import { partsForModule } from '../../src/lib/systemAtlas.gen'
import { FLOW_PATHS } from '../../src/lib/cardioFlow'
// Keep this renderer fixture independent from the full Tailwind/app stylesheet.
// The assertions below target WebGL output; importing index.css makes Vite scan
// the entire application source tree before DOMContentLoaded.

function Fixture() {
  const [module, setModule] = useState('mata')
  const [selected, select] = useState<string | null>(null)
  const [lesion, setLesion] = useState(false)
  const [flow, setFlow] = useState(false)
  const [mounted, setMounted] = useState(true)
  const parts = partsForModule(module)
  return <main style={{ maxWidth: 900, margin: 'auto', padding: 12 }}>
    <select aria-label="Atlas module" value={module} onChange={e => { setModule(e.target.value); select(null); setLesion(false); setFlow(false) }}>
      <option value="mata">Eye</option><option value="nefrologi">Kidney</option><option value="jantung-ruang">Heart</option>
    </select>
    <select aria-label="Structure" value={selected ?? ''} onChange={e => select(e.target.value || null)}>
      <option value="">None</option>{parts.map(p => <option key={p.name}>{p.name}</option>)}
    </select>
    <label><input type="checkbox" checked={lesion} onChange={e => setLesion(e.target.checked)} />Lesion</label>
    <label><input type="checkbox" checked={flow} onChange={e => setFlow(e.target.checked)} />Flow</label>
    <label><input type="checkbox" checked={mounted} onChange={e => setMounted(e.target.checked)} />Mounted</label>
    {mounted && <AtlasViewer3D berkas={`atlas/${module}.glb`} bagian={parts} dipilih={selected} onPilih={select} lesi={lesion ? [parts[0].name] : []} jalur={flow ? FLOW_PATHS.find(p => p.id === 'renal') : null} tinggi={420} />}
    <div style={{ height: 1800 }} aria-hidden="true" />
    <p>End of scroll fixture</p>
  </main>
}

// Halaman QA tidak membentuk akun atau memuat rekam pasien; tidak masuk bundel produksi.
if (import.meta.env.DEV) createRoot(document.getElementById('root')!).render(<React.StrictMode><Fixture /></React.StrictMode>)
