import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  buildClinicalFhirBundle,
  downloadClinicalFhirBundle,
  downloadSoapSbarReport,
  generateSoapSbarSummary,
  printClinicalReport,
  serializeClinicalFhirBundle,
} from '../../domains/clinical-operations'
import type { Vitals } from '../../lib/healthVitals'
import { readRecoveryLedger } from '../../domains/personal-health/adapters/recoveryLedgerStorage'

export interface ClinicalInteropSectionProps {
  readonly vitals: any
  readonly activePatient: any
  readonly account: any
  readonly emrCount: number
  readonly rev: number
}

export default function ClinicalInteropSection({
  vitals,
  activePatient,
  account,
  emrCount,
  rev,
}: ClinicalInteropSectionProps) {
  const [interopFeedback, setInteropFeedback] = useState<string | null>(null)

  const recoveryLedger = useMemo(() => {
    void rev
    return readRecoveryLedger()
  }, [rev])

  const castVitals = vitals as Vitals

  const { soapText, sbarText } = useMemo(() => {
    const base = generateSoapSbarSummary({ patient: activePatient, vitals: castVitals, account, emrCount })
    if (!recoveryLedger.length) return base
    const latest = recoveryLedger[0]
    const recoveryNote = `\nHolistic Recovery Ledger (${recoveryLedger.length} unreviewed draft session(s)): Latest ${latest.modalityName} · ${latest.doseLabel} (${latest.emvReceiptToken}).`
    return {
      soapText: `${base.soapText}${recoveryNote}`,
      sbarText: `${base.sbarText}${recoveryNote}`,
    }
  }, [activePatient, castVitals, account, emrCount, recoveryLedger])

  const fhirBundle = useMemo(
    () => buildClinicalFhirBundle({ vitals: castVitals, patient: activePatient, account, now: new Date() }),
    [castVitals, activePatient, account],
  )

  const flashFeedback = (kind: 'soap' | 'sbar' | 'fhir-copy' | 'fhir-dl' | 'summary-dl') => {
    setInteropFeedback(kind)
    setTimeout(() => setInteropFeedback((cur) => (cur === kind ? null : cur)), 2500)
  }

  const handleCopySoap = () => {
    navigator.clipboard?.writeText(soapText)
    flashFeedback('soap')
  }

  const handleCopySbar = () => {
    navigator.clipboard?.writeText(sbarText)
    flashFeedback('sbar')
  }

  const handleCopyFhir = () => {
    navigator.clipboard?.writeText(serializeClinicalFhirBundle(fhirBundle))
    flashFeedback('fhir-copy')
  }

  const handleDownloadSoapSbar = () => {
    downloadSoapSbarReport({ vitals: castVitals, patient: activePatient, account, emrCount })
    flashFeedback('summary-dl')
  }

  const handleDownloadFhir = () => {
    downloadClinicalFhirBundle({ vitals: castVitals, patient: activePatient, account })
    flashFeedback('fhir-dl')
  }

  return (
    <div
      className="dark mt-6 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-3"
      aria-label="Clinician workflow and interoperability readiness"
      data-testid="physician-workbench-actions"
    >
      <div className="border-l-2 border-emerald-400 pl-3">
        <div className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-300">
          Auto-SOAP / SBAR &amp; Consilium
        </div>
        <p className="mt-1 text-xs text-white/70">
          EMR: {emrCount ? '1 chart initialized' : 'None yet'} · HR {vitals.heartRate ?? vitals.restingHr ?? '—'} · SpO2{' '}
          {vitals.spo2Pct ?? '—'}% · BP{' '}
          {vitals.systolic && vitals.diastolic ? `${vitals.systolic}/${vitals.diastolic}` : '—'}.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { label: interopFeedback === 'soap' ? '✓ SOAP Copied' : 'Copy SOAP', onClick: handleCopySoap, cls: 'text-emerald-300' },
            { label: interopFeedback === 'sbar' ? '✓ SBAR Copied' : 'Copy SBAR', onClick: handleCopySbar, cls: 'text-neutral-100' },
            { label: interopFeedback === 'summary-dl' ? '✓ Downloaded' : 'Export .txt', onClick: handleDownloadSoapSbar, cls: 'text-neutral-100' },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              style={{ minHeight: 44, minWidth: 44, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.22)' }}
              className={`inline-flex items-center justify-center text-xs font-black ${btn.cls} hover:text-white transition active:scale-95`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link to="/emr" className="inline-flex min-h-[44px] items-center text-xs font-black text-emerald-300 hover:text-white">
            Open AI-EMR →
          </Link>
          <Link to="/clinical-calculators" className="inline-flex min-h-[44px] items-center text-xs font-black text-neutral-200 hover:text-white">
            Dose &amp; Scores →
          </Link>
        </div>
      </div>

      <div className="border-l-2 border-amber-400 pl-3">
        <div className="text-[10px] font-black uppercase tracking-[.12em] text-amber-300">
          Allergy &amp; Drug Safety Check
        </div>
        <p className="mt-1 text-xs text-white/70">
          Allergies: {activePatient?.allergies?.length ? activePatient.allergies.join(', ') : 'None recorded'} · Risk flags:{' '}
          {activePatient?.riskFlags?.length ?? 0}. CYP2C19 / HLA-B*15:02 screening available in Drug Check.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link to="/rujukan?t=obat" className="inline-flex min-h-[44px] items-center text-xs font-black text-amber-300 hover:text-white">
            Drug Check →
          </Link>
          <Link to="/emergency" className="inline-flex min-h-[44px] items-center text-xs font-black text-rose-300 hover:text-white">
            Emergency →
          </Link>
        </div>
      </div>

      <div className="border-l-2 border-cyan-400 pl-3">
        <div className="text-[10px] font-black uppercase tracking-[.12em] text-cyan-300">
          SATUSEHAT FHIR R4 &amp; Radar
        </div>
        <p className="mt-1 text-xs text-white/70">
          MRN: {activePatient?.mrn || '—'} · Permenkes 24/2022 bundle ({fhirBundle.entry.length} entries, draft unverified).
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: 'btn-export-fhir-pdf', label: interopFeedback === 'fhir-dl' ? '✓ FHIR Saved' : 'Export FHIR R4', onClick: handleDownloadFhir, cls: 'text-cyan-300' },
            { label: interopFeedback === 'fhir-copy' ? '✓ Copied' : 'Copy JSON', onClick: handleCopyFhir, cls: 'text-neutral-100' },
            { label: 'Print', onClick: printClinicalReport, cls: 'text-neutral-100' },
          ].map((btn) => (
            <button
              key={btn.label}
              id={btn.id}
              type="button"
              onClick={btn.onClick}
              style={{ minHeight: 44, minWidth: 44, padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.22)' }}
              className={`inline-flex items-center justify-center text-xs font-black ${btn.cls} hover:text-white transition active:scale-95`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link to="/visit-os" className="inline-flex min-h-[44px] items-center text-xs font-black text-cyan-300 hover:text-white">
            Open Visit OS →
          </Link>
          <Link to="/surveillance" className="inline-flex min-h-[44px] items-center text-xs font-black text-neutral-200 hover:text-white">
            Community Radar →
          </Link>
        </div>
      </div>
    </div>
  )
}
