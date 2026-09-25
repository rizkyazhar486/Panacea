// Tautan pasien praktik ↔ akun pasien. Dokter menerbitkan kode sekali pakai (7 hari);
// pasien menebusnya dari akunnya sendiri. Tanpa tautan, rekam yang dibuat dokter
// tidak pernah terlihat oleh pasiennya dan tidak masuk status longitudinalnya.
import { useEffect, useState } from 'react'
import { api, backendEnabled } from '../lib/api'
import { PERISTIWA_SINKRON } from '../lib/antreanKlinis'
import { useStore } from '../lib/store'

const PESAN: Record<string, string> = {
  invalid: 'That code was not found. Check it with your doctor.',
  expired: 'That code has expired. Ask your doctor for a new one.',
  used: 'That code was already used.',
  'already-linked': 'This record is already linked to another account.',
}
const galatDari = (e: unknown) => {
  const m = e instanceof Error ? e.message : ''
  return Object.entries(PESAN).find(([k]) => m.includes(k))?.[1] ?? 'Could not link the record. Try again.'
}

/** Untuk dokter: terbitkan kode tautan bagi pasien praktik. */
export function TerbitkanKodeTaut({ patientId }: { patientId: string }) {
  const [kode, setKode] = useState<{ code: string; expiresAt: string } | null>(null)
  const [galat, setGalat] = useState('')
  if (!backendEnabled || patientId.startsWith('self-')) return null
  return (
    <div className="mt-3 border-t border-neutral-200 pt-3" data-terbitkan-kode-taut>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Patient app access</p>
        <button type="button" className="rounded-lg border border-brand px-3 py-1.5 text-xs font-bold text-brand-dark"
          onClick={() => { setGalat(''); api.issueLinkCode(patientId).then(setKode).catch(() => setGalat('Could not create a code.')) }}>
          {kode ? 'New code' : 'Create link code'}
        </button>
      </div>
      {kode && (
        <p className="mt-1 text-xs">Give the patient this one-time code: <b className="font-mono text-sm tracking-wider" data-kode-taut>{kode.code}</b> · valid until {new Date(kode.expiresAt).toLocaleDateString('en-US')}</p>
      )}
      {galat && <p role="alert" className="mt-1 text-xs text-red-600">{galat}</p>}
    </div>
  )
}

/** Untuk pasien: tebus kode dari dokter, lihat & cabut tautan. */
export function TebusKodeTaut() {
  const akun = useStore().state.account
  const [kode, setKode] = useState('')
  const [links, setLinks] = useState<{ patientId: string; linkedAt: string }[]>([])
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok'>('idle')
  const [galat, setGalat] = useState('')
  const muat = () => api.myLinks().then((r) => setLinks(r.links)).catch(() => {})
  useEffect(() => { if (backendEnabled && akun && akun.role !== 'dokter') void muat() }, [akun])
  if (!backendEnabled || !akun || akun.role === 'dokter') return null
  async function tebus() {
    setStatus('busy'); setGalat('')
    try {
      await api.redeemLinkCode(kode)
      setKode(''); setStatus('ok'); await muat()
      window.dispatchEvent(new Event(PERISTIWA_SINKRON))
    } catch (e) { setStatus('idle'); setGalat(galatDari(e)) }
  }
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4" data-tebus-kode-taut>
      <h3 className="text-sm font-bold">Link your doctor's record</h3>
      <p className="text-xs text-neutral-500">Enter the one-time code from your doctor to see that record here.</p>
      <div className="mt-2 flex gap-2">
        <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="ABCDE-FGHJK" aria-label="Link code"
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm uppercase" />
        <button type="button" disabled={kode.replace(/[^a-z0-9]/gi, '').length < 10 || status === 'busy'} onClick={tebus}
          className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{status === 'busy' ? 'Linking…' : 'Link'}</button>
      </div>
      {status === 'ok' && <p className="mt-1 text-xs text-brand-dark">Linked. The doctor's signed record now joins your timeline.</p>}
      {galat && <p role="alert" className="mt-1 text-xs text-red-600">{galat}</p>}
      {links.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {links.map((l) => (
            <li key={l.patientId} className="flex items-center justify-between gap-2">
              <span>Linked record · since {new Date(l.linkedAt).toLocaleDateString('en-US')}</span>
              <button type="button" className="text-red-600 underline" onClick={() => api.unlink(l.patientId).then(muat).catch(() => {})}>Unlink</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
