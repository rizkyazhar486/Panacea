// src/domains/body-exposure/ui/OrganBiometricOverlayCard.tsx
// Bedside Patient Observation & Multiscale Anatomical Overlay Card
// Connects measured EHR vitals and transcribed labs to verified 3D organ identity
// Built with scoped inline styles to protect bundle budget invariant: cssBlokirGzip <= 115200

import React, { useMemo } from 'react'
import {
  ATLAS_STRUCTURE_DISCLAIMER,
  OVERLAY_LABEL,
  computeCanonicalRecordOverlays,
  resolveAnatomicalOverlayBinding,
  type CanonicalRecordInput,
  type RecordOverlayResultItem,
  type RecordOverlaySuccessItem,
} from '../engine/recordOverlayEngine.ts'
import { useStore } from '../../../lib/store'
import { ambilLab } from '../../../lib/lab'
import { getVitals } from '../../../lib/healthVitals'

interface Props {
  readonly organKey: string
  readonly organLabel: string
}

export function OrganBiometricOverlayCard({ organKey, organLabel }: Props): React.ReactElement | null {
  const { state, activePatient } = useStore()

  // 1. Resolve canonical multiscale anatomical binding
  const binding = useMemo(() => {
    return resolveAnatomicalOverlayBinding(organKey)
  }, [organKey])

  // 2. Gather active patient observations matching this organ
  const canonicalRecords = useMemo<CanonicalRecordInput[]>(() => {
    if (!binding) return []

    const list: CanonicalRecordInput[] = []
    const nowIso = new Date().toISOString()
    const organId = binding.canonicalOrganId

    // A. Query transcribed laboratory entries from verified storage
    const allLabs = ambilLab()
    for (const [rawJenisId, entries] of Object.entries(allLabs)) {
      if (!Array.isArray(entries)) continue
      const jenis = rawJenisId.toLowerCase()

      for (const item of entries) {
        if (!item || typeof item.nilai !== 'number' || !Number.isFinite(item.nilai)) continue

        // Map laboratory items to target organs
        if (organId === 'kidney' && (jenis.includes('kreatinin') || jenis.includes('creatinine'))) {
          list.push({
            targetOrgan: 'kidney',
            testName: 'creatinine',
            value: item.nilai,
            unit: 'mg/dL',
            timestamp: item.tanggal ? `${item.tanggal}T08:00:00Z` : nowIso,
            truthClass: 'measured',
            source: 'lab-transcription',
          })
        } else if (organId === 'heart' && (jenis.includes('troponin') || jenis.includes('trop'))) {
          list.push({
            targetOrgan: 'heart',
            testName: 'troponin',
            value: item.nilai,
            unit: 'ng/mL',
            timestamp: item.tanggal ? `${item.tanggal}T08:00:00Z` : nowIso,
            truthClass: 'measured',
            source: 'lab-transcription',
          })
        } else if (organId === 'pancreas' && (jenis.includes('glukosa') || jenis.includes('glucose') || jenis === 'gdp')) {
          list.push({
            targetOrgan: 'pancreas',
            testName: 'glucose',
            value: item.nilai,
            unit: 'mg/dL',
            timestamp: item.tanggal ? `${item.tanggal}T08:00:00Z` : nowIso,
            truthClass: 'measured',
            source: 'lab-transcription',
          })
        }
      }
    }

    // B. Query vital signs from store / device snapshots
    const patientVitals = state.vitals[activePatient.id] ?? []
    const latestVital = patientVitals[patientVitals.length - 1]
    const snapshot = getVitals()

    const hr = typeof latestVital?.heartRate === 'number' ? latestVital.heartRate : snapshot?.heart_rate
    const sbp = typeof latestVital?.systolic === 'number' ? latestVital.systolic : snapshot?.blood_pressure_systolic
    const spo2Val = typeof latestVital?.spo2 === 'number' ? latestVital.spo2 : snapshot?.spo2

    if (organId === 'heart') {
      if (typeof hr === 'number' && Number.isFinite(hr) && hr > 0) {
        list.push({
          targetOrgan: 'heart',
          testName: 'heart_rate',
          value: hr,
          unit: 'bpm',
          timestamp: nowIso,
          truthClass: 'measured',
          source: 'vitals-telemetry',
        })
      }
      if (typeof sbp === 'number' && Number.isFinite(sbp) && sbp > 0) {
        list.push({
          targetOrgan: 'heart',
          testName: 'blood_pressure_systolic',
          value: sbp,
          unit: 'mmHg',
          timestamp: nowIso,
          truthClass: 'measured',
          source: 'vitals-telemetry',
        })
      }
    } else if (organId === 'lung') {
      if (typeof spo2Val === 'number' && Number.isFinite(spo2Val) && spo2Val > 0) {
        list.push({
          targetOrgan: 'lung',
          testName: 'spo2',
          value: spo2Val,
          unit: '%',
          timestamp: nowIso,
          truthClass: 'measured',
          source: 'pulse-oximetry',
        })
      }
    }

    return list
  }, [binding, state.vitals, activePatient.id])

  // 3. Compute deterministic overlays using recordOverlayEngine
  const overlays = useMemo<readonly RecordOverlayResultItem[]>(() => {
    if (!binding || canonicalRecords.length === 0) return []
    return computeCanonicalRecordOverlays(canonicalRecords, {
      allowExplicitConversion: true,
      requireMappedOrganIdentity: true,
      rejectSimulatedInObservedMode: true,
    })
  }, [binding, canonicalRecords])

  if (!binding) {
    return null
  }

  const successItems = overlays.filter((item): item is RecordOverlaySuccessItem => item.ok === true)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
        marginTop: '8px',
        marginBottom: '8px',
      }}
      data-testid="organ-biometric-overlay-card"
    >
      {/* Title & Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#047857' }}>
          {OVERLAY_LABEL}
        </div>
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '999px',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            color: '#065f46',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          {binding.fmaId} · {binding.uberonId}
        </span>
      </div>

      {/* Multiscale Anatomical Identity Lineage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '6px',
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          fontSize: '10.5px',
          lineHeight: 1.4,
          border: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      >
        <div>
          <span style={{ color: '#64748b' }}>L1 System:</span> <strong>{binding.l1System}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>L3 Substructure:</span> <strong>{binding.l3Substructure}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>L5 Cell Type:</span> <strong>{binding.l5Cell}</strong>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>L7 Pathway:</span> <strong>{binding.l7Pathway}</strong>
        </div>
      </div>

      {/* Observed Metrics List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {successItems.length > 0 ? (
          successItems.map((item, idx) => {
            const isAbnormal = item.referenceStatus === 'above-range' || item.referenceStatus === 'below-range'
            return (
              <div
                key={`${item.metricName}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  backgroundColor: isAbnormal ? 'rgba(254, 226, 226, 0.6)' : 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid',
                  borderColor: isAbnormal ? 'rgba(239, 68, 68, 0.35)' : 'rgba(203, 213, 225, 0.6)',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'capitalize' }}>
                    {item.metricName.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    {item.referenceRange
                      ? `Reference Range: [${item.referenceRange[0]} – ${item.referenceRange[1]} ${item.unit}]`
                      : 'Clinical reference range: dynamic / unclassified'}
                    {item.conversion.converted && item.conversion.formula && (
                      <span style={{ marginLeft: '4px', color: '#0369a1' }}>
                        · ({item.conversion.formula})
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-angka)',
                      fontSize: '13px',
                      fontWeight: 900,
                      color: isAbnormal ? '#b91c1c' : '#047857',
                    }}
                  >
                    {item.displayValue}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: isAbnormal ? '#fee2e2' : '#d1fae5',
                      color: isAbnormal ? '#991b1b' : '#065f46',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.referenceStatus.replace(/-/g, ' ')}
                  </span>
                  <span
                    style={{
                      fontSize: '8.5px',
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      color: '#1d4ed8',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.truthClass}
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(241, 245, 249, 0.6)',
              border: '1px dashed rgba(148, 163, 184, 0.4)',
              fontSize: '11px',
              color: '#64748b',
              lineHeight: 1.45,
            }}
          >
            <em>No patient observations recorded for the {organLabel.toLowerCase()} (empty is not zero — missing data is never guessed as 0).</em>
          </div>
        )}
      </div>

      {/* Strict Provenance & Atlas Disclaimer */}
      <div style={{ fontSize: '9.5px', color: '#64748b', lineHeight: 1.4 }}>
        <strong>Atlas Structure Disclaimer:</strong> {ATLAS_STRUCTURE_DISCLAIMER}
      </div>
    </div>
  )
}

export default OrganBiometricOverlayCard
