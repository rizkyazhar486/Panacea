import { useEffect, useState } from 'react'
import { Card, SectionTitle, Field, inputClass, Button, Badge } from '../components/ui'
import { IconHeart, IconPhone, IconShield } from '../components/icons'

// ─────────────────────────────────────────────────────────────────────────────
// Emergency Medical Card + SOS — a lock-screen-style card a paramedic or
// bystander can read in seconds, plus a one-tap SOS that dials help and shares a
// live location link. Fully offline (localStorage); nothing leaves the device
// until the user actively taps SOS/share. Maps to the "SOS one-tap", "digital
// allergy tag" and "offline emergency card" features across the lists.
// ─────────────────────────────────────────────────────────────────────────────

interface EmData {
  name: string; bloodType: string; dob: string
  allergies: string; conditions: string; medications: string
  emergencyName: string; emergencyPhone: string
  organDonor: boolean; notes: string
  localEmergencyNumber: string
}
const DEF: EmData = {
  name: '', bloodType: '', dob: '', allergies: '', conditions: '', medications: '',
  emergencyName: '', emergencyPhone: '', organDonor: false, notes: '', localEmergencyNumber: '112',
}
const KEY = 'pmd_emergency_card_v1'

const BLOOD = ['', 'O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−']

function load(): EmData { try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return DEF } }

export function EmergencyCard() {
  const [d, setD] = useState<EmData>(load)
  const [editing, setEditing] = useState(() => !localStorage.getItem(KEY))
  const [locStatus, setLocStatus] = useState<'idle' | 'getting' | 'ok' | 'fail'>('idle')
  const [mapsUrl, setMapsUrl] = useState('')

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ } }, [d])
  const u = (p: Partial<EmData>) => setD((x) => ({ ...x, ...p }))

  function shareLocation() {
    if (!navigator.geolocation) { setLocStatus('fail'); return }
    setLocStatus('getting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const url = `https://maps.google.com/?q=${latitude},${longitude}`
        setMapsUrl(url); setLocStatus('ok')
        // Try the native share sheet so it can go to WhatsApp/SMS/etc.
        const text = `🚨 EMERGENCY — ${d.name || 'I'} need help. My location: ${url}${d.bloodType ? ` · Blood type ${d.bloodType}` : ''}${d.allergies ? ` · Allergies: ${d.allergies}` : ''}`
        if (navigator.share) navigator.share({ title: 'Emergency location', text }).catch(() => {})
      },
      () => setLocStatus('fail'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const age = d.dob ? Math.floor((Date.now() - new Date(d.dob).getTime()) / (365.25 * 864e5)) : null

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      {/* SOS actions — always on top */}
      <Card className="!p-5">
        <SectionTitle icon={<IconPhone size={20} />} title="Emergency SOS" subtitle="One tap to call help and share your live location" />
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a href={`tel:${(d.localEmergencyNumber || '112').replace(/[^0-9+]/g, '')}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-500 py-4 text-base font-black text-white transition active:scale-95">
            📞 Call {d.localEmergencyNumber || '112'}
          </a>
          <button onClick={shareLocation}
            className="flex items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-base font-black text-white transition active:scale-95 dark:bg-white/10">
            📍 {locStatus === 'getting' ? 'Getting location…' : 'Share my location'}
          </button>
        </div>
        {d.emergencyPhone && (
          <a href={`tel:${d.emergencyPhone.replace(/[^0-9+]/g, '')}`}
            className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-3 text-sm font-bold text-ink transition active:scale-95 dark:border-white/10 dark:text-white">
            👤 Call emergency contact{d.emergencyName ? ` — ${d.emergencyName}` : ''}
          </a>
        )}
        {locStatus === 'ok' && mapsUrl && (
          <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-dark">
            Location ready. <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline">Open map</a> — send it to your contact if the share sheet didn't open.
          </p>
        )}
        {locStatus === 'fail' && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">Couldn't get your location. Enable GPS/location permission and try again.</p>}
      </Card>

      {/* The card itself */}
      <Card className="!p-0 overflow-hidden">
        <div className="bg-rose-500 px-5 py-3 text-white">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wide"><IconShield size={16} /> Medical ID</span>
            <button onClick={() => setEditing((e) => !e)} className="text-xs font-bold underline">{editing ? 'Done' : 'Edit'}</button>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full name"><input className={inputClass} value={d.name} onChange={(e) => u({ name: e.target.value })} /></Field>
              <Field label="Date of birth"><input className={inputClass} type="date" value={d.dob} onChange={(e) => u({ dob: e.target.value })} /></Field>
              <Field label="Blood type">
                <select className={inputClass} value={d.bloodType} onChange={(e) => u({ bloodType: e.target.value })}>
                  {BLOOD.map((b) => <option key={b} value={b}>{b || '—'}</option>)}
                </select>
              </Field>
              <Field label="Local emergency number"><input className={inputClass} value={d.localEmergencyNumber} onChange={(e) => u({ localEmergencyNumber: e.target.value })} placeholder="112 / 118 / 911" /></Field>
            </div>
            <Field label="Allergies (comma-separated)"><input className={inputClass} value={d.allergies} onChange={(e) => u({ allergies: e.target.value })} placeholder="Penicillin, peanuts…" /></Field>
            <Field label="Medical conditions"><input className={inputClass} value={d.conditions} onChange={(e) => u({ conditions: e.target.value })} placeholder="Asthma, diabetes…" /></Field>
            <Field label="Current medications"><input className={inputClass} value={d.medications} onChange={(e) => u({ medications: e.target.value })} placeholder="Insulin, salbutamol…" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Emergency contact name"><input className={inputClass} value={d.emergencyName} onChange={(e) => u({ emergencyName: e.target.value })} /></Field>
              <Field label="Emergency contact phone"><input className={inputClass} value={d.emergencyPhone} onChange={(e) => u({ emergencyPhone: e.target.value })} /></Field>
            </div>
            <Field label="Other notes"><input className={inputClass} value={d.notes} onChange={(e) => u({ notes: e.target.value })} placeholder="Pacemaker, pregnancy, DNR wishes…" /></Field>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
              <input type="checkbox" checked={d.organDonor} onChange={(e) => u({ organDonor: e.target.checked })} /> Registered organ donor
            </label>
            <Button onClick={() => setEditing(false)} className="w-full">Save card</Button>
          </div>
        ) : (
          <div className="space-y-3 p-5">
            <div>
              <div className="text-2xl font-black text-ink dark:text-white">{d.name || 'Add your name'}</div>
              <div className="text-sm text-neutral-500">{age != null ? `${age} yrs` : ''}{d.organDonor ? ' · 🫀 Organ donor' : ''}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {d.bloodType && <Badge tone="critical">Blood {d.bloodType}</Badge>}
              {d.allergies && <Badge tone="critical">⚠️ Allergies</Badge>}
            </div>
            <Row label="Allergies" value={d.allergies} danger />
            <Row label="Conditions" value={d.conditions} />
            <Row label="Medications" value={d.medications} />
            <Row label="Emergency contact" value={[d.emergencyName, d.emergencyPhone].filter(Boolean).join(' · ')} />
            <Row label="Notes" value={d.notes} />
            {!d.name && <p className="text-xs text-neutral-400">Tap <b>Edit</b> to fill in your details — they're saved on this device and shown here even offline.</p>}
          </div>
        )}
      </Card>

      <div className="rounded-2xl border border-neutral-100 bg-white p-4 text-center text-[11px] leading-relaxed text-neutral-400 dark:border-white/10 dark:bg-white/5">
        <IconHeart size={12} className="mr-1 inline" /> Saved only on this device and shown even without internet. Location is shared only when you tap the button. Tip: install Panaceamed to your home screen and add this page as a shortcut so it's reachable fast in an emergency. Local emergency numbers vary — set yours above (112 works in many countries).
      </div>
    </div>
  )
}

function Row({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-t border-neutral-100 pt-2 dark:border-white/10">
      <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={'text-sm ' + (danger ? 'font-bold text-rose-600' : 'text-ink dark:text-white')}>{value}</div>
    </div>
  )
}

export default EmergencyCard
