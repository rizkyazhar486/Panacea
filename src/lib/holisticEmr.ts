import type { EMRRecord, Patient, SupportiveResult, VitalSign } from './types'

export const HOLISTIC_EMR_SCHEMA_VERSION = 1 as const

export type ProvenanceSource = 'clinician' | 'patient' | 'device' | 'laboratory' | 'imaging' | 'import' | 'ai' | 'system'
export type VerificationState = 'unverified' | 'verified' | 'entered-in-error'
export type ProblemListStatus = 'unknown' | 'unreviewed' | 'reviewed' | 'reviewed-empty'
export type AllergyStatus = 'unknown' | 'known-allergies' | 'no-known-allergies'
export type MedicationReconciliationStatus = 'unknown' | 'reconciled' | 'no-current-medications'
export type ClinicalStatus = 'active' | 'inactive' | 'resolved'
export type NoteState = 'draft' | 'signed' | 'amended'
export type OrderState = 'draft' | 'placed' | 'in-progress' | 'completed' | 'cancelled'

export interface ClinicalProvenance {
  sourceType: ProvenanceSource
  sourceLabel: string
  sourceId?: string
  recordedAt: string
  recordedBy?: string
  verification: VerificationState
  evidenceRef?: string
}

export interface HolisticProblem {
  id: string
  display: string
  code?: string
  codeSystem?: 'ICD-10' | 'ICD-11' | 'SNOMED-CT' | 'other'
  status: ClinicalStatus
  certainty?: 'suspected' | 'probable' | 'confirmed'
  onsetAt?: string
  resolvedAt?: string
  basis?: string
  provenance: ClinicalProvenance
}

export interface HolisticAllergy {
  id: string
  substance: string
  reaction?: string
  severity?: 'mild' | 'moderate' | 'severe' | 'unknown'
  status: 'active' | 'inactive' | 'entered-in-error'
  provenance: ClinicalProvenance
}

export interface HolisticMedication {
  id: string
  name: string
  dose?: string
  route?: string
  frequency?: string
  indication?: string
  status: 'active' | 'completed' | 'stopped' | 'unknown'
  startedAt?: string
  endedAt?: string
  provenance: ClinicalProvenance
}

export interface HolisticVitalPanel {
  id: string
  observedAt: string
  systolic?: number
  diastolic?: number
  heartRate?: number
  respiratoryRate?: number
  temperatureC?: number
  spo2?: number
  glucoseMgDl?: number
  note?: string
  provenance: ClinicalProvenance
}

export interface HolisticDiagnosticResult {
  id: string
  category: 'laboratory' | 'ecg' | 'imaging' | 'pathology' | 'other'
  name: string
  value?: string
  unit?: string
  referenceRange?: string
  flag?: 'low' | 'normal' | 'high' | 'critical'
  interpretation?: string
  observedAt: string
  status: 'preliminary' | 'final' | 'corrected' | 'unknown'
  provenance: ClinicalProvenance
}

export interface HolisticImagingStudy {
  id: string
  modality?: string
  bodySite?: string
  studyName: string
  impression?: string
  performedAt?: string
  status: 'ordered' | 'performed' | 'final' | 'cancelled' | 'unknown'
  provenance: ClinicalProvenance
}

export interface HolisticProcedure {
  id: string
  name: string
  code?: string
  indication?: string
  performedAt?: string
  outcome?: string
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled' | 'unknown'
  provenance: ClinicalProvenance
}

export interface HolisticOrder {
  id: string
  category: 'laboratory' | 'imaging' | 'medication' | 'procedure' | 'referral' | 'monitoring' | 'other'
  name: string
  indication?: string
  priority?: 'routine' | 'urgent' | 'stat'
  state: OrderState
  orderedAt?: string
  orderedBy?: string
  provenance: ClinicalProvenance
}

export interface HolisticEncounter {
  id: string
  type: 'outpatient' | 'emergency' | 'inpatient' | 'telemedicine' | 'home' | 'other'
  reason?: string
  startedAt: string
  endedAt?: string
  location?: string
  careTeam: string[]
  disposition?: string
  provenance: ClinicalProvenance
}

export interface AiDraftMeta {
  generated: boolean
  model?: string
  generatedAt?: string
  evidenceRefs: string[]
  clinicianReviewed: boolean
  reviewedBy?: string
  reviewedAt?: string
  accepted?: boolean
}

export interface HolisticClinicalNote {
  id: string
  encounterId?: string
  type: 'SOAP' | 'H&P' | 'progress' | 'consult' | 'procedure' | 'discharge' | 'other'
  title: string
  text: string
  state: NoteState
  author?: string
  authoredAt: string
  signedAt?: string
  ai?: AiDraftMeta
  provenance: ClinicalProvenance
}

export interface HolisticCarePlan {
  id: string
  goal: string
  interventions: string[]
  owner?: string
  targetAt?: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  provenance: ClinicalProvenance
}

export interface HolisticImmunization {
  id: string
  vaccine: string
  date?: string
  status: 'completed' | 'due' | 'overdue' | 'declined' | 'unknown'
  provenance: ClinicalProvenance
}

export interface HolisticPreventiveItem {
  id: string
  name: string
  status: 'due' | 'completed' | 'not-due' | 'declined' | 'not-applicable' | 'unknown'
  dueAt?: string
  completedAt?: string
  provenance: ClinicalProvenance
}

export interface HolisticNarrativeDomain {
  id: string
  domain: 'family-history' | 'social-determinants' | 'lifestyle' | 'mental-health' | 'reproductive' | 'development' | 'nutrition'
  text: string
  assessedAt: string
  provenance: ClinicalProvenance
}

export interface HolisticGenomicFinding {
  id: string
  gene?: string
  variant?: string
  classification?: string
  clinicalSignificance?: string
  source?: string
  observedAt: string
  provenance: ClinicalProvenance
}

export interface HolisticDeviceDatum {
  id: string
  device: string
  metric: string
  value: string
  unit?: string
  observedAt: string
  provenance: ClinicalProvenance
}

export interface HolisticDocument {
  id: string
  title: string
  kind: 'referral' | 'consent' | 'report' | 'external-record' | 'image' | 'other'
  url?: string
  createdAt: string
  provenance: ClinicalProvenance
}

export interface HolisticAuditEvent {
  id: string
  at: string
  actor: string
  action: string
  target?: string
  detail?: string
}

export interface AiGovernancePolicy {
  draftOnly: true
  evidenceLinkingRequired: true
  clinicianReviewRequired: true
  autoSignAllowed: false
  autoMedicationCommitAllowed: false
  autoOrderCommitAllowed: false
}

export interface HolisticChart {
  schemaVersion: typeof HOLISTIC_EMR_SCHEMA_VERSION
  patientId: string
  updatedAt: string
  problemListStatus: ProblemListStatus
  allergyStatus: AllergyStatus
  medicationReconciliation: MedicationReconciliationStatus
  problems: HolisticProblem[]
  allergies: HolisticAllergy[]
  medications: HolisticMedication[]
  vitals: HolisticVitalPanel[]
  diagnostics: HolisticDiagnosticResult[]
  imaging: HolisticImagingStudy[]
  procedures: HolisticProcedure[]
  orders: HolisticOrder[]
  encounters: HolisticEncounter[]
  notes: HolisticClinicalNote[]
  carePlans: HolisticCarePlan[]
  immunizations: HolisticImmunization[]
  preventiveCare: HolisticPreventiveItem[]
  narratives: HolisticNarrativeDomain[]
  genomics: HolisticGenomicFinding[]
  devices: HolisticDeviceDatum[]
  documents: HolisticDocument[]
  audit: HolisticAuditEvent[]
  aiGovernance: AiGovernancePolicy
}

export type HolisticEMRRecord = EMRRecord & { holistic?: HolisticChart }

export type HolisticDomainId =
  | 'identity' | 'encounters' | 'problems' | 'allergies' | 'medications' | 'vitals'
  | 'diagnostics' | 'imaging' | 'procedures' | 'orders' | 'notes' | 'care-plans'
  | 'immunizations' | 'preventive-care' | 'family-history' | 'social-lifestyle'
  | 'mental-health' | 'reproductive-development' | 'genomics' | 'devices'
  | 'documents' | 'provenance' | 'audit' | 'ai-governance'

export interface HolisticDomainScore {
  id: HolisticDomainId
  label: string
  weight: number
  completeness: number
  state: 'complete' | 'partial' | 'missing'
  detail: string
}

export interface HolisticCompleteness {
  score: number
  criticalReady: boolean
  missingCritical: string[]
  domains: HolisticDomainScore[]
}

export const HOLISTIC_DOMAIN_WEIGHTS: Record<HolisticDomainId, number> = {
  identity: 1,
  encounters: 2,
  problems: 3,
  allergies: 3,
  medications: 3,
  vitals: 1.5,
  diagnostics: 1.5,
  imaging: 0.75,
  procedures: 0.75,
  orders: 1.5,
  notes: 2,
  'care-plans': 1.5,
  immunizations: 0.75,
  'preventive-care': 1,
  'family-history': 0.5,
  'social-lifestyle': 1,
  'mental-health': 1,
  'reproductive-development': 0.5,
  genomics: 0.5,
  devices: 0.5,
  documents: 0.5,
  provenance: 2,
  audit: 1,
  'ai-governance': 3,
}

const AI_POLICY: AiGovernancePolicy = {
  draftOnly: true,
  evidenceLinkingRequired: true,
  clinicianReviewRequired: true,
  autoSignAllowed: false,
  autoMedicationCommitAllowed: false,
  autoOrderCommitAllowed: false,
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function legacyProvenance(recordedAt: string, sourceId?: string, signedBy?: string): ClinicalProvenance {
  return {
    sourceType: signedBy ? 'clinician' : 'import',
    sourceLabel: signedBy ? 'Clinician-signed Panaceamed EMR' : 'Existing Panaceamed EMR',
    sourceId,
    recordedAt,
    recordedBy: signedBy,
    verification: signedBy ? 'verified' : 'unverified',
  }
}

function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const map = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) map.set(item.id, { ...map.get(item.id), ...item })
  return [...map.values()]
}

function narrative(id: string, domain: HolisticNarrativeDomain['domain'], text: string, at: string, provenance: ClinicalProvenance): HolisticNarrativeDomain | null {
  const clean = text.trim()
  return clean ? { id, domain, text: clean, assessedAt: at, provenance } : null
}

export function createEmptyHolisticChart(patientId: string, now = new Date().toISOString()): HolisticChart {
  return {
    schemaVersion: HOLISTIC_EMR_SCHEMA_VERSION,
    patientId,
    updatedAt: now,
    problemListStatus: 'unknown',
    allergyStatus: 'unknown',
    medicationReconciliation: 'unknown',
    problems: [], allergies: [], medications: [], vitals: [], diagnostics: [], imaging: [], procedures: [], orders: [],
    encounters: [], notes: [], carePlans: [], immunizations: [], preventiveCare: [], narratives: [], genomics: [], devices: [], documents: [], audit: [],
    aiGovernance: AI_POLICY,
  }
}

export function buildHolisticChartFromLegacy(input: {
  patient: Patient
  record: EMRRecord
  vitals?: VitalSign[]
  supportive?: SupportiveResult[]
  actor?: string
  now?: string
}): HolisticChart {
  const { patient, record } = input
  const now = input.now ?? new Date().toISOString()
  const current = (record as HolisticEMRRecord).holistic
  const base: HolisticChart = current?.schemaVersion === HOLISTIC_EMR_SCHEMA_VERSION
    ? { ...current, aiGovernance: AI_POLICY }
    : createEmptyHolisticChart(patient.id, now)
  const provenance = legacyProvenance(record.updatedAt || now, record.id, record.signedBy)

  const problems: HolisticProblem[] = [
    ...patient.chronicConditions.map((display, index) => ({
      id: `legacy:chronic:${patient.id}:${index}`,
      display,
      status: 'active' as const,
      certainty: 'confirmed' as const,
      provenance: { ...provenance, sourceId: patient.id, sourceLabel: 'Patient problem list' },
    })),
    ...record.problems.map((problem) => ({
      id: `legacy:problem:${problem.id}`,
      display: problem.title,
      code: record.primaryDiagnosis?.title === problem.title ? record.primaryDiagnosis.code : undefined,
      codeSystem: record.primaryDiagnosis?.title === problem.title ? 'ICD-10' as const : undefined,
      status: 'active' as const,
      certainty: typeof problem.probability === 'number' && problem.probability >= 90 ? 'probable' as const : 'suspected' as const,
      basis: problem.basis,
      provenance,
    })),
  ]

  const allergies: HolisticAllergy[] = patient.allergies.map((substance, index) => ({
    id: `legacy:allergy:${patient.id}:${index}`,
    substance,
    severity: 'unknown',
    status: 'active',
    provenance: { ...provenance, sourceId: patient.id, sourceLabel: 'Patient allergy list' },
  }))

  const vitals: HolisticVitalPanel[] = (input.vitals ?? []).map((vital) => ({
    id: `legacy:vital:${vital.id}`,
    observedAt: vital.takenAt,
    systolic: vital.systolic,
    diastolic: vital.diastolic,
    heartRate: vital.heartRate,
    respiratoryRate: vital.respRate,
    temperatureC: vital.tempC,
    spo2: vital.spo2,
    glucoseMgDl: vital.glucose,
    note: vital.note,
    provenance: {
      sourceType: 'patient', sourceLabel: 'Panaceamed vital log', sourceId: vital.id,
      recordedAt: vital.takenAt, verification: 'unverified',
    },
  }))

  const diagnosticResults: HolisticDiagnosticResult[] = (input.supportive ?? [])
    .filter((result) => result.category !== 'Radiologi')
    .map((result) => ({
      id: `legacy:diagnostic:${result.id}`,
      category: result.category === 'Lab' ? 'laboratory' : result.category === 'EKG' ? 'ecg' : 'other',
      name: result.name,
      value: result.value,
      unit: result.unit,
      referenceRange: result.reference,
      flag: result.flag,
      observedAt: result.takenAt,
      status: 'unknown',
      provenance: {
        sourceType: result.category === 'Lab' ? 'laboratory' : 'import',
        sourceLabel: `Panaceamed ${result.category}`,
        sourceId: result.id,
        recordedAt: result.takenAt,
        verification: 'unverified',
      },
    }))

  const imaging: HolisticImagingStudy[] = (input.supportive ?? [])
    .filter((result) => result.category === 'Radiologi')
    .map((result) => ({
      id: `legacy:imaging:${result.id}`,
      studyName: result.name,
      impression: [result.value, result.unit].filter(Boolean).join(' '),
      performedAt: result.takenAt,
      status: 'unknown',
      provenance: {
        sourceType: 'imaging', sourceLabel: 'Panaceamed radiology result', sourceId: result.id,
        recordedAt: result.takenAt, verification: 'unverified',
      },
    }))

  const encounter: HolisticEncounter = {
    id: `legacy:encounter:${record.id}`,
    type: 'outpatient',
    reason: record.anamnesis.keluhanUtama || undefined,
    startedAt: record.createdAt,
    endedAt: record.signedAt,
    careTeam: record.signedBy ? [record.signedBy] : [],
    provenance,
  }

  const noteText = [
    `S: ${record.anamnesis.keluhanUtama}\n${record.anamnesis.rps}`,
    `O: ${record.physicalExam.general}\n${record.physicalExam.vitalsNote}\n${record.physicalExam.perSystem}`,
    `A: ${record.problems.map((problem) => `${problem.title}: ${problem.assessment}`).join('\n')}`,
    `P: ${record.plan.map((item) => `[${item.category}] ${item.text}`).join('\n')}`,
  ].join('\n\n')
  const note: HolisticClinicalNote = {
    id: `legacy:note:${record.id}`,
    encounterId: encounter.id,
    type: 'SOAP',
    title: 'Current AI-EMR SOAP note',
    text: noteText,
    state: record.signedAt ? 'signed' : 'draft',
    author: record.signedBy,
    authoredAt: record.updatedAt,
    signedAt: record.signedAt,
    ai: {
      generated: true,
      evidenceRefs: record.references,
      clinicianReviewed: Boolean(record.signedAt && record.signedBy),
      reviewedBy: record.signedBy,
      reviewedAt: record.signedAt,
      accepted: Boolean(record.signedAt && record.signedBy),
    },
    provenance,
  }

  const narrativeCandidates = [
    narrative(`legacy:family:${record.id}`, 'family-history', record.anamnesis.rpk, record.updatedAt, provenance),
    narrative(`legacy:social:${record.id}`, 'social-determinants', record.anamnesis.riwayatSosialEkonomi, record.updatedAt, provenance),
    narrative(`legacy:nutrition:${record.id}`, 'nutrition', record.anamnesis.riwayatNutrisi, record.updatedAt, provenance),
    narrative(`legacy:development:${record.id}`, 'development', record.anamnesis.riwayatTumbuhKembang, record.updatedAt, provenance),
    narrative(`legacy:reproductive:${record.id}`, 'reproductive', record.anamnesis.riwayatKehamilan, record.updatedAt, provenance),
  ].filter((item): item is HolisticNarrativeDomain => item !== null)

  const problemListStatus: ProblemListStatus = base.problemListStatus !== 'unknown'
    ? base.problemListStatus
    : record.signedAt ? (problems.length ? 'reviewed' : 'reviewed-empty') : problems.length ? 'unreviewed' : 'unknown'
  const allergyStatus: AllergyStatus = base.allergyStatus !== 'unknown'
    ? base.allergyStatus
    : allergies.length ? 'known-allergies' : 'unknown'

  return {
    ...base,
    patientId: patient.id,
    updatedAt: now,
    problemListStatus,
    allergyStatus,
    problems: mergeById(base.problems, problems),
    allergies: mergeById(base.allergies, allergies),
    vitals: mergeById(base.vitals, vitals),
    diagnostics: mergeById(base.diagnostics, diagnosticResults),
    imaging: mergeById(base.imaging, imaging),
    encounters: mergeById(base.encounters, [encounter]),
    notes: mergeById(base.notes, [note]),
    narratives: mergeById(base.narratives, narrativeCandidates),
    aiGovernance: AI_POLICY,
  }
}

function hasVerifiedProvenance(chart: HolisticChart) {
  const all = [
    ...chart.problems, ...chart.allergies, ...chart.medications, ...chart.vitals, ...chart.diagnostics,
    ...chart.imaging, ...chart.procedures, ...chart.orders, ...chart.encounters, ...chart.notes,
    ...chart.carePlans, ...chart.immunizations, ...chart.preventiveCare, ...chart.narratives,
    ...chart.genomics, ...chart.devices, ...chart.documents,
  ]
  return all.length > 0 && all.some((item) => item.provenance.verification === 'verified')
}

function domain(id: HolisticDomainId, label: string, completeness: number, detail: string): HolisticDomainScore {
  const value = clamp01(completeness)
  return {
    id, label, weight: HOLISTIC_DOMAIN_WEIGHTS[id], completeness: value,
    state: value >= 0.999 ? 'complete' : value > 0 ? 'partial' : 'missing', detail,
  }
}

export function calculateHolisticCompleteness(chart: HolisticChart): HolisticCompleteness {
  const family = chart.narratives.filter((item) => item.domain === 'family-history')
  const social = chart.narratives.filter((item) => item.domain === 'social-determinants' || item.domain === 'lifestyle' || item.domain === 'nutrition')
  const mental = chart.narratives.filter((item) => item.domain === 'mental-health')
  const reproductive = chart.narratives.filter((item) => item.domain === 'reproductive' || item.domain === 'development')
  const signedNotes = chart.notes.filter((note) => note.state === 'signed' || note.state === 'amended')
  const aiSafe = chart.aiGovernance.draftOnly && chart.aiGovernance.clinicianReviewRequired && !chart.aiGovernance.autoSignAllowed && !chart.aiGovernance.autoMedicationCommitAllowed && !chart.aiGovernance.autoOrderCommitAllowed

  const domains: HolisticDomainScore[] = [
    domain('identity', 'Identity', chart.patientId ? 1 : 0, chart.patientId ? 'Patient identity linked' : 'Patient identity missing'),
    domain('encounters', 'Encounters', chart.encounters.length ? 1 : 0, `${chart.encounters.length} encounter(s)`),
    domain('problems', 'Problem list', chart.problemListStatus === 'reviewed' || chart.problemListStatus === 'reviewed-empty' ? 1 : chart.problems.length ? 0.5 : 0, chart.problemListStatus),
    domain('allergies', 'Allergies', chart.allergyStatus === 'no-known-allergies' ? 1 : chart.allergyStatus === 'known-allergies' ? (chart.allergies.length ? 0.85 : 0.25) : chart.allergies.length ? 0.5 : 0, chart.allergyStatus),
    domain('medications', 'Medication reconciliation', chart.medicationReconciliation === 'no-current-medications' ? 1 : chart.medicationReconciliation === 'reconciled' ? 1 : chart.medications.length ? 0.5 : 0, chart.medicationReconciliation),
    domain('vitals', 'Vitals', chart.vitals.length ? 1 : 0, `${chart.vitals.length} observation panel(s)`),
    domain('diagnostics', 'Labs / ECG / pathology', chart.diagnostics.length ? 1 : 0, `${chart.diagnostics.length} result(s)`),
    domain('imaging', 'Imaging', chart.imaging.length ? 1 : 0, `${chart.imaging.length} study/studies`),
    domain('procedures', 'Procedures', chart.procedures.length ? 1 : 0, `${chart.procedures.length} procedure(s)`),
    domain('orders', 'Orders / referrals', chart.orders.length ? 1 : 0, `${chart.orders.length} order(s)`),
    domain('notes', 'Clinical notes', signedNotes.length ? 1 : chart.notes.length ? 0.5 : 0, `${signedNotes.length} signed / ${chart.notes.length} total`),
    domain('care-plans', 'Care plans', chart.carePlans.length ? 1 : 0, `${chart.carePlans.length} plan(s)`),
    domain('immunizations', 'Immunizations', chart.immunizations.length ? 1 : 0, `${chart.immunizations.length} immunization record(s)`),
    domain('preventive-care', 'Prevention / screening', chart.preventiveCare.length ? 1 : 0, `${chart.preventiveCare.length} preventive item(s)`),
    domain('family-history', 'Family history', family.length ? 1 : 0, `${family.length} entry/entries`),
    domain('social-lifestyle', 'Social / lifestyle / nutrition', social.length ? 1 : 0, `${social.length} entry/entries`),
    domain('mental-health', 'Mental health', mental.length ? 1 : 0, `${mental.length} entry/entries`),
    domain('reproductive-development', 'Reproductive / development', reproductive.length ? 1 : 0, `${reproductive.length} entry/entries`),
    domain('genomics', 'Genomics', chart.genomics.length ? 1 : 0, `${chart.genomics.length} finding(s)`),
    domain('devices', 'Devices / wearables', chart.devices.length ? 1 : 0, `${chart.devices.length} datum/data`),
    domain('documents', 'Documents / consent', chart.documents.length ? 1 : 0, `${chart.documents.length} document(s)`),
    domain('provenance', 'Provenance', hasVerifiedProvenance(chart) ? 1 : chart.notes.length || chart.encounters.length ? 0.5 : 0, hasVerifiedProvenance(chart) ? 'Verified source chain present' : 'Only unverified/imported sources'),
    domain('audit', 'Audit trail', chart.audit.length ? 1 : 0, `${chart.audit.length} chart event(s)`),
    domain('ai-governance', 'AI governance', aiSafe ? 1 : 0, aiSafe ? 'Draft-only + clinician gates enforced' : 'Safety policy incomplete'),
  ]

  const totalWeight = domains.reduce((sum, item) => sum + item.weight, 0)
  const weighted = domains.reduce((sum, item) => sum + item.weight * item.completeness, 0)
  const missingCritical: string[] = []
  if (chart.problemListStatus !== 'reviewed' && chart.problemListStatus !== 'reviewed-empty') missingCritical.push('Problem list has not been clinician-reviewed')
  if (chart.allergyStatus === 'unknown') missingCritical.push('Allergy status is unknown')
  if (chart.allergyStatus === 'known-allergies' && chart.allergies.length === 0) missingCritical.push('Known-allergy status has no allergy entries')
  if (chart.medicationReconciliation === 'unknown') missingCritical.push('Medication reconciliation is incomplete')
  if (!chart.encounters.length) missingCritical.push('Encounter context is missing')
  if (!signedNotes.length) missingCritical.push('No signed clinical note is present')
  if (!aiSafe) missingCritical.push('AI governance guardrails are incomplete')

  return {
    score: totalWeight ? Math.round((weighted / totalWeight) * 100) : 0,
    criticalReady: missingCritical.length === 0,
    missingCritical,
    domains,
  }
}

export function canCommitAiDraft(meta?: AiDraftMeta): boolean {
  return Boolean(meta?.generated && meta.clinicianReviewed && meta.accepted && meta.reviewedBy && meta.reviewedAt && meta.evidenceRefs.length)
}

export function appendAudit(chart: HolisticChart, actor: string, action: string, target?: string, detail?: string, at = new Date().toISOString()): HolisticChart {
  const event: HolisticAuditEvent = {
    id: `audit:${at}:${Math.random().toString(36).slice(2, 8)}`,
    at, actor: actor || 'Unknown clinician', action, target, detail,
  }
  return { ...chart, updatedAt: at, audit: [...chart.audit, event].slice(-250) }
}

export function newClinicalId(prefix: string) {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`
}
