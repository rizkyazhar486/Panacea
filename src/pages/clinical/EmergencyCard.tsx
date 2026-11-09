import { useEffect, useState } from 'react'
import { Field, inputClass } from '../../components/ui/ui'
import { IconHeart, IconPhone, IconShield } from '../../components/icons'
import { BatasKlaimKesehatan } from '../../components/BatasKlaimKesehatan'
import { tr } from '../../lib/i18n'
import { useBahasa } from '../../lib/useBahasa'
import { ageYears, contactTelHref, emergencyDisplayNumber, emergencyShareText, emergencyTelHref, mapsUrl } from '../../domains/emergency-card/engine/emergencyCard'

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
  useBahasa()
  const [d, setD] = useState<EmData>(load)
  const [editing, setEditing] = useState(() => !localStorage.getItem(KEY))
  const [locStatus, setLocStatus] = useState<'idle' | 'getting' | 'ok' | 'fail'>('idle')
  const [mapUrl, setMapUrl] = useState('')

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ } }, [d])
  const u = (p: Partial<EmData>) => setD((x) => ({ ...x, ...p }))

  function shareLocation() {
    if (locStatus === 'getting') return // tanpa kirim ganda saat lokasi sedang diambil
    if (!navigator.geolocation) { setLocStatus('fail'); return }
    setLocStatus('getting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = mapsUrl(pos.coords.latitude, pos.coords.longitude)
        if (!url) { setLocStatus('fail'); return } // koordinat tak valid: gagal tertutup, tidak dibagikan
        setMapUrl(url); setLocStatus('ok')
        // Try the native share sheet so it can go to WhatsApp/SMS/etc.
        const text = emergencyShareText({ name: d.name, url, bloodType: d.bloodType, allergies: d.allergies })
        if (navigator.share) navigator.share({ title: 'Emergency location', text }).catch(() => {})
      },
      () => setLocStatus('fail'),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const age = ageYears(d.dob, Date.now())
  const contactHref = contactTelHref(d.emergencyPhone)
  const callNumber = emergencyDisplayNumber(d.localEmergencyNumber)

  return (
    <div className="emc-page">
      {/* SOS — selalu di atas: satu tindakan utama, tombol panggil raksasa */}
      <section className="emc-sos" aria-labelledby="emc-sos-title">
        <div>
          <div className="emc-eyebrow">{tr('Emergency')}</div>
          <h2 id="emc-sos-title" className="emc-title">{tr('Emergency SOS')}</h2>
        </div>

        <a href={emergencyTelHref(d.localEmergencyNumber)} className="emc-call" data-testid="emc-call" aria-label={`${tr('Call')} ${callNumber}`}>
          <span className="emc-call__icon" aria-hidden="true"><IconPhone size={36} /></span>
          <span>
            <span className="emc-call__label">{tr('Call')}</span>
            <span className="emc-call__number">{callNumber}</span>
          </span>
        </a>

        <div className={'emc-tiles' + (contactHref ? '' : ' emc-tiles--single')}>
          <button type="button" className="emc-tile" onClick={shareLocation} disabled={locStatus === 'getting'} data-testid="emc-share">
            <span className="emc-tile__glyph" aria-hidden="true">📍</span>
            {locStatus === 'getting' ? tr('Getting location…') : tr('Share my location')}
          </button>
          {contactHref ? (
            <a href={contactHref} className="emc-tile emc-tile--contact" data-testid="emc-contact">
              <span className="emc-tile__glyph" aria-hidden="true">👤</span>
              {tr('Call my contact')}
              {d.emergencyName && <span className="emc-tile__sub">{d.emergencyName}</span>}
            </a>
          ) : (
            <button type="button" className="emc-tile emc-tile--ghost" onClick={() => setEditing(true)} data-testid="emc-add-contact">
              <span className="emc-tile__glyph" aria-hidden="true">➕</span>
              {tr('Add a contact')}
            </button>
          )}
        </div>

        {locStatus === 'ok' && mapUrl && (
          <p className="emc-status emc-status--ok" role="status">
            {tr('Location ready.')} <a href={mapUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{tr('Open map')}</a> — {tr("send it to your contact if the share sheet didn't open.")}
          </p>
        )}
        {locStatus === 'fail' && <p className="emc-status emc-status--bad" role="alert">{tr("Couldn't get your location. Enable GPS/location permission and try again.")}</p>}

        {/* Teks batas klaim: kata-katanya TIDAK diubah dan sengaja tidak diterjemahkan (perubahan memerlukan peninjau klinis). */}
        <div className="emc-note" data-pmd-unclamped="true">
          <p style={{ margin: 0, fontWeight: 700 }}>Local emergency card + one-tap call/share — not a clinically validated Panacea emergency system</p>
          <BatasKlaimKesehatan permukaan="care.emergency-card" />
          <p>
            Stored on this device until you tap SOS or share. Does not replace certified emergency services, medical-alert devices, or institutional triage. Verify the local emergency number for your country.
          </p>
        </div>
      </section>

      {/* Kartu Identitas Medis */}
      <section className="emc-id" aria-labelledby="emc-id-title">
        <div className="emc-id__bar">
          <span className="emc-id__tag" id="emc-id-title"><IconShield size={18} /> {tr('Medical ID')}</span>
          <button type="button" className="emc-pill" onClick={() => setEditing((e) => !e)} data-testid="emc-edit">{editing ? tr('Done') : tr('Edit')}</button>
        </div>

        {editing ? (
          <div className="emc-form">
            <div className="emc-form__row">
              <Field label="Full name"><input className={inputClass} value={d.name} onChange={(e) => u({ name: e.target.value })} /></Field>
              <Field label="Date of birth"><input className={inputClass} type="date" value={d.dob} onChange={(e) => u({ dob: e.target.value })} /></Field>
              <Field label="Blood type">
                <select className={inputClass} value={d.bloodType} onChange={(e) => u({ bloodType: e.target.value })}>
                  {BLOOD.map((b) => <option key={b} value={b}>{b || '—'}</option>)}
                </select>
              </Field>
              <Field label="Local emergency number"><input className={inputClass} value={d.localEmergencyNumber} onChange={(e) => u({ localEmergencyNumber: e.target.value })} placeholder="112 / 118 / 911" inputMode="tel" /></Field>
            </div>
            <Field label="Allergies (comma-separated)"><input className={inputClass} value={d.allergies} onChange={(e) => u({ allergies: e.target.value })} placeholder="Penicillin, peanuts…" /></Field>
            <Field label="Medical conditions"><input className={inputClass} value={d.conditions} onChange={(e) => u({ conditions: e.target.value })} placeholder="Asthma, diabetes…" /></Field>
            <Field label="Current medications"><input className={inputClass} value={d.medications} onChange={(e) => u({ medications: e.target.value })} placeholder="Insulin, salbutamol…" /></Field>
            <div className="emc-form__row">
              <Field label="Emergency contact name"><input className={inputClass} value={d.emergencyName} onChange={(e) => u({ emergencyName: e.target.value })} /></Field>
              <Field label="Emergency contact phone"><input className={inputClass} value={d.emergencyPhone} onChange={(e) => u({ emergencyPhone: e.target.value })} inputMode="tel" /></Field>
            </div>
            <Field label="Other notes"><input className={inputClass} value={d.notes} onChange={(e) => u({ notes: e.target.value })} placeholder="Pacemaker, pregnancy, DNR wishes…" /></Field>
            <label className="flex items-center gap-3 text-sm font-semibold">
              <input type="checkbox" checked={d.organDonor} onChange={(e) => u({ organDonor: e.target.checked })} /> {tr('Registered organ donor')}
            </label>
            <button type="button" className="emc-cta" onClick={() => setEditing(false)} data-testid="emc-save">{tr('Save card')}</button>
          </div>
        ) : (
          <div className="emc-id__body">
            <div className="emc-id__head">
              <div style={{ minWidth: 0 }}>
                <h2 className="emc-name">{d.name || tr('Add your name')}</h2>
                <div className="emc-sub">{age != null ? `${age} ${tr('yrs')}` : ''}{d.organDonor ? ` · 🫀 ${tr('Organ donor')}` : ''}</div>
              </div>
              {d.bloodType && <div className="emc-blood" data-testid="emc-blood"><b>{d.bloodType}</b><span>{tr('Blood')}</span></div>}
            </div>
            {d.allergies && (
              <div className="emc-alert" role="note" data-testid="emc-allergies">
                <span className="emc-alert__glyph" aria-hidden="true">⚠️</span>
                <div><b>{tr('Allergies')}</b><span>{d.allergies}</span></div>
              </div>
            )}
            {(d.conditions || d.medications || d.emergencyName || d.emergencyPhone || d.notes) && (
              <div className="emc-facts">
                <Fact label={tr('Conditions')} value={d.conditions} />
                <Fact label={tr('Medications')} value={d.medications} />
                <Fact label={tr('Emergency contact')} value={[d.emergencyName, d.emergencyPhone].filter(Boolean).join(' · ')} />
                <Fact label={tr('Notes')} value={d.notes} />
              </div>
            )}
            {!d.name && (
              <div className="emc-empty">
                <p>{tr('Tap Edit to fill in your details. They are saved on this device and shown here even offline.')}</p>
                <button type="button" className="emc-cta" onClick={() => setEditing(true)} data-testid="emc-fill">{tr('Fill in my card')}</button>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="emc-foot" style={{ gridColumn: '1 / -1' }}>
        <IconHeart size={12} className="mr-1 inline" /> Saved only on this device and shown even without internet. Location is shared only when you tap the button. Tip: install Panaceamed to your home screen and add this page as a shortcut so it's reachable fast in an emergency. Local emergency numbers vary — set yours above (112 works in many countries).
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return <div className="emc-fact"><b>{label}</b><span>{value}</span></div>
}

export default EmergencyCard
