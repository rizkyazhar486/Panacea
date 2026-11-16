/**
 * @file clinicalInteropActions.ts
 * @description Browser file download & print actions for HL7 FHIR R4 Bundles and SOAP/SBAR drafts.
 */

import type { Bundel } from '../../../lib/fhir'
import { hariIni } from '../../../lib/tanggal'
import { simpanTeks } from '../../../lib/unduh'
import {
  buildClinicalFhirBundle,
  generateSoapSbarSummary,
  serializeClinicalFhirBundle,
  type ClinicalBundleOptions,
  type SoapSbarSummary,
} from '../model/clinicalInterop'

export function downloadClinicalFhirBundle(options: ClinicalBundleOptions): Bundel {
  const now = options.now ?? new Date()
  const bundle = buildClinicalFhirBundle({ ...options, now })
  const json = serializeClinicalFhirBundle(bundle)
  const dateStr = hariIni()
  const nameSlug = (options.patient?.name || options.account?.name || 'patient')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    void simpanTeks(json, `panaceamed-satusehat-fhir-r4-${nameSlug}-${dateStr}.json`, 'application/fhir+json;charset=utf-8', 'Panaceamed.id FHIR R4')
  }
  return bundle
}

export function downloadSoapSbarReport(options: ClinicalBundleOptions & { emrCount?: number }): SoapSbarSummary {
  const now = options.now ?? new Date()
  const summary = generateSoapSbarSummary({ ...options, nowIso: now.toISOString() })
  const dateStr = hariIni()
  const nameSlug = (options.patient?.name || options.account?.name || 'patient')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const content = `${summary.soapText}\n${summary.sbarText}`
    void simpanTeks(content, `panaceamed-soap-sbar-${nameSlug}-${dateStr}.txt`, 'text/plain;charset=utf-8', 'Panaceamed.id SOAP/SBAR')
  }
  return summary
}

export function printClinicalReport(): void {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print()
  }
}
