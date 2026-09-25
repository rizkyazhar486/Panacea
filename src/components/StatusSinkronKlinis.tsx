import { useEffect, useState } from 'react'
import { bacaAntrean, bacaGalat, catatGalat, PERISTIWA_SINKRON } from '../lib/antreanKlinis'
import { kurasSinkronKlinis } from '../lib/store'

// Status sinkron catatan klinis: tidak pernah diam. Tampil hanya bila ada yang
// tertunda (belum di server) atau ditolak server; selain itu tidak memakan tempat.
export function StatusSinkronKlinis() {
  const baca = () => ({ antre: bacaAntrean(localStorage).length, galat: bacaGalat(localStorage) })
  const [s, setS] = useState(baca)
  useEffect(() => {
    const segarkan = () => setS(baca())
    window.addEventListener(PERISTIWA_SINKRON, segarkan)
    window.addEventListener('online', segarkan)
    return () => { window.removeEventListener(PERISTIWA_SINKRON, segarkan); window.removeEventListener('online', segarkan) }
  }, [])
  if (!s.antre && !s.galat) return null
  return (
    <div role="status" data-clinical-sync={s.galat ? 'refused' : 'pending'}
      className={`rounded-xl border px-3 py-2 text-[12px] font-bold ${s.galat ? 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200' : 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200'}`}>
      {s.antre > 0 && <p>{s.antre} clinical change{s.antre > 1 ? 's are' : ' is'} saved on this device and not yet on the server.</p>}
      {s.galat && <p>The server refused a clinical change ({s.galat.pesan}). It was not saved there.</p>}
      <div className="mt-1 flex gap-2">
        {s.antre > 0 && <button type="button" onClick={() => void kurasSinkronKlinis()} className="min-h-9 rounded-lg border px-2.5 text-[11px] font-black">Retry now</button>}
        {s.galat && <button type="button" onClick={() => { catatGalat(localStorage, null); setS(baca()) }} className="min-h-9 rounded-lg border px-2.5 text-[11px] font-black">Dismiss</button>}
      </div>
    </div>
  )
}
