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
  probability?: number // 0-100 Bayesian estimate
  differentials?: string[] // diagnosis banding with distinguishing features
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
  prognosis?: string
  references: string[]
  signedBy?: string
  signedAt?: string
}

// AI-generated patient-facing disease education (brief + deep).
export interface EducationSheet {
  diagnosis: string
  ringkas: string // brief plain-language summary
  mendalam: string // deeper explanation
  caraMenjaga: string[] // how to maintain health
  tandaBahaya: string[] // red flags / when to seek care
  generatedAt: string
}

// -- Marketplace / tokenized medical notes & materials -----------------------

export type MaterialCategory = 'Catatan' | 'Materi' | 'Jurnal' | 'AI-EMR Template'
export type ExamTrack = 'USMLE' | 'UKMPPD' | 'Umum'
export type FileType = 'Word' | 'PDF' | 'PowerPoint'
export type MaterialStatus =
  | 'pending-ai' // awaiting Claude AI verification
  | 'pending-verifier' // awaiting specialist verifier
  | 'verified' // approved & listed
  | 'rejected'

export interface AIReview {
  verdict: 'approved' | 'revise'
  score: number // 0-100 quality/accuracy
  notes: string
  at: string
}

export interface VerifierReview {
  verifierName: string
  verifierRole: 'Spesialis' | 'Subspesialis'
  approved: boolean
  notes: string
  at: string
}

export interface Material {
  id: string
  title: string
  description: string
  category: MaterialCategory
  exam: ExamTrack
  specialty: string
  authorId: string
  authorName: string
  fileType: FileType
  fileName: string
  priceTokens: number
  status: MaterialStatus
  aiReview?: AIReview
  verifierReview?: VerifierReview
  createdAt: string
  downloads: number
  rating: number
}

export interface Contributor {
  id: string
  name: string
  role: 'Dokter' | 'Spesialis' | 'Subspesialis'
  specialty: string
  verified: boolean // verified as a contributor by a verifier
  canVerify: boolean // is a verifier (specialist/subspecialist)
}

export type TxType = 'deposit' | 'purchase' | 'payout' | 'subscription'
export interface WalletTx {
  id: string
  type: TxType
  amount: number // tokens (+in / -out)
  note: string
  at: string
}
export interface Wallet {
  balance: number // PanaceaToken (PNC)
  transactions: WalletTx[]
}

export type SubscriptionPlan = 'none' | 'individu' | 'rumah-sakit'
export interface Subscription {
  plan: SubscriptionPlan
  since?: string
  seats?: number // for hospital plan
}

export interface AppState {
  patients: Patient[]
  activePatientId: string
  vitals: Record<string, VitalSign[]>
  supportive: Record<string, SupportiveResult[]>
  chats: Record<string, ChatMessage[]>
  records: Record<string, EMRRecord>
  education: Record<string, EducationSheet> // by patientId
  materials: Material[]
  ownedMaterialIds: string[]
  contributors: Contributor[]
  wallet: Wallet
  subscription: Subscription
  currentUserId: string // the logged-in contributor (demo "act as")
  settings: {
    apiKey: string
    model: string
    doctorName: string
  }
}
