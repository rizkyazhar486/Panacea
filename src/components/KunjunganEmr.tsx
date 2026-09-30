// Kunjungan AI-EMR: tutup kunjungan bertanda tangan server, mulai draf baru, dan
// lihat kunjungan tertutup. Hanya rekam bertanda tangan server yang dapat ditutup;
// draf baru membawa daftar masalah saja (bukan diagnosis, rencana atau tanda tangan).
import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { useStore } from '../lib/store'
import type { EMRRecord } from '../lib/types'

type Tertutup = EMRRecord & { encounterId: string; closedAt: string; closedBy?: string }

export function bolehTutupKunjungan(r: Pick<EMRRecord, 'signedAt' | 'signedById'>, dirty: boolean, klinisi: boolean) {
  return klinisi && !dirty && Boolean(r.signedAt && r.signedById)
}

export function KunjunganEmr({ record, dirty, klinisi }: { record: EMRRecord; dirty: boolean; klinisi: boolean }) {
  const { terapkanRekamServer } = useStore()
  const [daftar, setDaftar] = useState<Tertutup[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle')
  const [galat, setGalat] = useState('')
  const pid = record.patientId

  useEffect(() => {
    if (!backendEnabled) return
    let aktif = true
    api.encounters(pid).then((r) => { if (aktif) setDaftar(r.encounters) }).catch(() => { if (aktif) setDaftar(null) })
    return () => { aktif = false }
  }, [pid, record.id])

  if (!backendEnabled) return <p className="text-xs text-neutral-500">Encounters need the server; this record stays a single draft offline.</p>
  const boleh = bolehTutupKunjungan(record, dirty, klinisi)

  async function tutup() {
    setStatus('busy'); setGalat('')
    try {
      const r = await api.closeEncounter(pid)
      terapkanRekamServer(r.record)
      setStatus('idle')
    } catch (e) {
      setStatus('error'); setGalat(e instanceof Error ? e.message : 'Could not close the encounter')
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-200 pt-3" data-kunjungan-emr>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Encounters{daftar ? ` · ${daftar.length} closed` : ''}</p>
        {klinisi && (
          <button type="button" onClick={tutup} disabled={!boleh || status === 'busy'}
            className="rounded-lg border border-brand px-3 py-1.5 text-xs font-bold text-brand-dark disabled:opacity-40">
            {status === 'busy' ? 'Closing…' : 'Close encounter & start new'}
          </button>
        )}
      </div>
      {klinisi && !boleh && <p className="mt-1 text-xs text-neutral-500">Sign and save this record on the server before closing it.</p>}
      {status === 'error' && <p role="alert" className="mt-1 text-xs text-red-600">{galat}</p>}
      {record.previousEncounterId && <p className="mt-1 text-xs text-neutral-500">New encounter — problem list carried from the previous visit; diagnosis and plan start empty.</p>}
      {daftar && daftar.length > 0 && (
        <ol className="mt-2 space-y-1">
          {daftar.slice().reverse().map((k) => (
            <li key={k.encounterId}>
              <details className="rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                <summary className="cursor-pointer">
                  {new Date(k.closedAt).toLocaleDateString('en-US')} · {k.primaryDiagnosis ? `${k.primaryDiagnosis.code} ${k.primaryDiagnosis.title}` : 'no primary diagnosis'} · signed by {k.signedBy ?? '—'}
                </summary>
                <p className="mt-1">Chief complaint: {k.anamnesis?.keluhanUtama || '—'}</p>
                <p>Problems: {k.problems?.map((p) => p.title).join('; ') || '—'}</p>
                <p>Verified plan: {k.plan?.filter((p) => p.status === 'diverifikasi').map((p) => p.text).join('; ') || '—'}</p>
                <p className="text-neutral-500">Closed by {k.closedBy ?? '—'} · read-only</p>
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
