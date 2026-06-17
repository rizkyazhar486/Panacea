// Shared domain types for the Panaceamed.id Longevity Medical-AI platform.

export type Sex = 'L' | 'P'

export type RiskFlag = 'chronic' | 'elderly' | 'immunocompromised'

export interface Patient {
  id: string
  name: string
  sex: Sex
  dob: string // ISO date
  mrn: string // medical record number
  heightCm: number
  weightKg: number
  bloodType?: string
  allergies: string[]
  chronicConditions: string[]
  riskFlags: RiskFlag[]
  avatarColor: string
}

export interface VitalSign {
  id: string
  takenAt: string // ISO datetime
  systolic: number
  diastolic: number
  heartRate: number
  respRate: number
  tempC: number
  spo2: number
  glucose?: number // mg/dL
  note?: string
}

export interface SupportiveResult {
  id: string
  takenAt: string
  category: 'Lab' | 'EKG' | 'Radiologi' | 'Lainnya'
  name: string
  value: string
  unit?: string
  reference?: string
  flag?: 'low' | 'normal' | 'high' | 'critical'
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  at: string
}

// Anamnesis captured by the AI chatbot, structured per the master prompt.
export interface Anamnesis {
  keluhanUtama: string
  rps: string // SOCRATES narrative
  rpd: string
  rpk: string
  riwayatKehamilan: string
  riwayatPengobatan: string
  riwayatAlergi: string
  riwayatTumbuhKembang: string
  riwayatNutrisi: string
  riwayatImunisasi: string
  riwayatSosialEkonomi: string
}

// Physical exam — AI may suggest, but the doctor fills/edits and signs.
export interface PhysicalExam {
  general: string
  vitalsNote: string
  perSystem: string
  doctorVerified: boolean
  verifiedBy?: string
}

export interface PlanItem {
  id: string
  category: 'Suportif' | 'Definitif' | 'Edukasi' | 'Follow-up' | 'Monitoring'
  text: string
  source: 'AI' | 'Dokter'
  status: 'usulan' | 'diverifikasi' | 'ditolak'
}

export interface ProblemEntry {
  id: string
  title: string
  basis: string // basis from anamnesis/exam/supporting
  assessment: string // "Dipikirkan ..." comparative reasoning
}

export interface EMRRecord {
  id: string
  patientId: string
  createdAt: string
  updatedAt: string
  anamnesis: Anamnesis
  physicalExam: PhysicalExam
  problems: ProblemEntry[]
  plan: PlanItem[]
  references: string[]
  signedBy?: string
  signedAt?: string
}

export interface AppState {
  patients: Patient[]
  activePatientId: string
  vitals: Record<string, VitalSign[]>
  supportive: Record<string, SupportiveResult[]>
  chats: Record<string, ChatMessage[]>
  records: Record<string, EMRRecord>
  settings: {
    apiKey: string
    model: string
    doctorName: string
  }
}
