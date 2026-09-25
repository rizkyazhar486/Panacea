import { useEffect, useState } from 'react'
import { api, backendEnabled, type FhirBundelLab } from '../lib/api'

// Tampilan dokter: hasil lab yang DIBAGIKAN pasien, dibaca sebagai FHIR
// Observation. Setiap pembukaan tercatat di jejak audit pasien (server).
// Angkanya disalin pasien dari lembar hasil — ditandai jelas, bukan dari lab.
export function LabPasienUntukDokter() {
  const [daftar, setDaftar] = useState<{ id: string; berakhir: string; pasien: string }[] | null>(null)
  const [buka, setBuka] = useState<{ pasien: string; bundle: FhirBundelLab } | null>(null)
  const [galat, setGalat] = useState<string | null>(null)
  useEffect(() => { if (backendEnabled) api.clinicianLabShares().then((r) => setDaftar(r.shares)).catch((e) => setGalat((e as Error).message)) }, [])
  if (!backendEnabled) return null

  const kelompok = new Map<string, FhirBundelLab['entry'][number]['resource'][]>()
  for (const e of buka?.bundle.entry ?? []) {
    const k = e.resource.code.text
    kelompok.set(k, [...(kelompok.get(k) ?? []), e.resource].sort((a, b) => a.effectiveDateTime.localeCompare(b.effectiveDateTime)))
  }

  return (
    <section className="dark rounded-[20px] border border-white/10 bg-[#050708] p-3 text-white" aria-label="Lab results shared with you" data-clinician-lab>
      <h2 className="text-sm font-black">Lab results shared with you</h2>
      {galat && <p className="mt-1 text-[11px] font-bold text-amber-300">{galat === 'verified clinician role required' ? 'Available after your STR is verified.' : galat}</p>}
      {daftar && daftar.length === 0 && <p className="mt-1 text-[11px] text-white/55">No patient has shared lab results with you yet.</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {daftar?.map((d) => (
          <button key={d.id} type="button" className="min-h-10 rounded-full border border-white/15 px-3 text-[11px] font-black"
            onClick={() => api.clinicianLabFhir(d.id).then((r) => setBuka(r)).catch((e) => setGalat((e as Error).message))}>
            {d.pasien} · until {d.berakhir.slice(0, 10)}
          </button>
        ))}
      </div>
      {buka && (
        <div className="mt-3">
          <p className="text-[11px] font-bold text-amber-200">{buka.pasien} · patient-transcribed from lab reports — verify against the original before clinical use.</p>
          <table className="mt-2 w-full text-left text-[12px]">
            <thead className="text-[10px] uppercase tracking-wide text-white/45"><tr><th className="py-1 pr-2">Test</th><th className="pr-2">Latest</th><th className="pr-2">Prev.</th><th>Date</th></tr></thead>
            <tbody>
              {[...kelompok.entries()].map(([nama, obs]) => {
                const a = obs[obs.length - 1], b = obs[obs.length - 2]
                const loinc = a.code.coding?.[0]?.code
                return (
                  <tr key={nama} className="border-t border-white/10">
                    <td className="py-1.5 pr-2">{nama}<span className="block text-[9px] text-white/40">{loinc ? `LOINC ${loinc}` : 'not coded'}</span></td>
                    <td className="pr-2 tabular-nums font-black">{a.valueQuantity.value} <span className="font-normal text-white/50">{a.valueQuantity.unit}</span></td>
                    <td className="pr-2 tabular-nums text-white/60">{b ? b.valueQuantity.value : '—'}</td>
                    <td className="tabular-nums text-white/60">{a.effectiveDateTime}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {kelompok.size === 0 && <p className="mt-1 text-[11px] text-white/55">This patient has no lab results yet.</p>}
        </div>
      )}
    </section>
  )
}

export default LabPasienUntukDokter
