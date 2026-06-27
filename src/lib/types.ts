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
  // Diagnosis utama (ICD-10) — picked by the doctor or accepted from AI.
  primaryDiagnosis?: { code: string; title: string; chapter?: string; source?: 'AI' | 'Dokter' }
  plan: PlanItem[]
  prognosis?: string
  // Penunjang & supportive (Mode-1 clinical workup)
  labEkgInterpretation?: string // interpretasi temuan Lab & hasil EKG
  supportive?: SupportivePlan
  surgery?: SurgeryPlan
  references: string[]
  signedBy?: string
  signedAt?: string
}

// Supportive therapy numbers: resuscitation, fluid balance, calories, urine output.
export interface SupportivePlan {
  resusitasi: string
  balansCairan: string
  kebutuhanKalori: string
  urineOutput: string
}

// Surgery recommendation with multi-stage informed consent.
export interface SurgeryPlan {
  recommended: boolean
  procedure: string
  indication: string
  pre: string
  intra: string
  post: string
  risks: string
  consent: ConsentStage[]
}
export interface ConsentStage {
  stage: 'Chatbot-AI' | 'Rekomendasi Operasi' | 'Pemberian Obat' | 'Tindakan/Operasi'
  agreed: boolean
  at?: string
}

// -------- Accounts & roles -------------------------------------------------
export type Role = 'pasien' | 'dokter' | 'kontributor' | 'verifikator' | 'admin' | 'owner'
export interface Account {
  email: string
  name: string
  role: Role
  isSubscriber: boolean
  patientId?: string // for pasien/dokter linkage
  loggedAt: string
  // Registration background (collected at sign-up)
  sex?: Sex // jenis kelamin (L/P)
  age?: number
  dob?: string // ISO date of birth (from datepicker)
  nik?: string // NIK (optional, sensitive — UU PDP)
  occupation?: string
  background?: string // latar belakang singkat
  str?: string // doctor's Surat Tanda Registrasi / practice certificate no.
  gelar?: string // academic/professional title (penulis)
  keahlian?: string // area of expertise
  universitas?: string // alma mater
  tahunLulus?: string // graduation year
  spesialis?: string // specialty (penulis)
  subspesialis?: string // subspecialty (verifikator)
  strStatus?: 'none' | 'pending' | 'verified' // STR verification gate for AI-EMR
  consentAt?: string // ISO timestamp of T&C + privacy + informed consent
  isOwner?: boolean // true for the platform owner account (mode-switch enabled)
}

// -------- Social feed — "Panacea Hidup Sehat" (Strava + IG + RedNote) -------
// A social network for healthy living. A post is one of three kinds:
//  • aktivitas  — physical activity with Strava-style metrics
//  • kebiasaan  — daily healthy-habit log (water, vegetables, sleep, dll.)
//  • artikel    — a longevity / healthy-lifestyle article snippet
export type PostType = 'aktivitas' | 'kebiasaan' | 'artikel'

export interface PostComment {
  id: string
  authorName: string
  text: string
  at: string
}

export interface SocialPost {
  id: string
  authorEmail: string
  authorName: string
  role: Role
  kind: 'image' | 'video' | 'text'
  postType?: PostType // defaults to 'aktivitas' for legacy posts
  activity: string // lari, berenang, padel, makan sehat ...
  caption: string
  mediaColor: string
  durationSec?: number // for video (<=15)
  // Strava-style activity metrics (optional)
  distanceKm?: number
  durationMin?: number
  steps?: number
  calories?: number
  // Healthy-habit metrics (optional)
  waterMl?: number
  veggieServ?: number
  sleepHr?: number
  sugaryDrinks?: number
  // Longevity article snippet (optional)
  articleTitle?: string
  articleSource?: string
  // TikTok-style media & social state
  photos?: string[] // real uploaded images (data URLs) or gradient color placeholders
  videoUrl?: string // uploaded short video (object URL)
  videoSec?: number // video length in seconds (<=180s / 3 min)
  audio?: string // selected background song title
  location?: string // tagged location
  archived?: boolean // hidden/archived by the owner
  locked?: boolean // private/locked post (only owner sees in "Terkunci")
  exclusive?: boolean // subscriber-only content (monetized via creator subscription)
  likes: number
  comments?: number
  commentList?: PostComment[] // inline comment thread
  reposts?: number
  reactions?: Record<string, string[]> // emoji -> emails who reacted (peduli/semangat/doa/bangga)
  likedByMe?: boolean
  repostedByMe?: boolean
  bookmarkedByMe?: boolean
  at: string
}

// -------- Stories (Instagram-style, 24h ephemeral) -------------------------
export interface Story {
  id: string
  authorEmail: string
  authorName: string
  mediaColor: string
  image?: string // data URL / object URL photo
  video?: string // data URL / object URL short video
  caption?: string
  at: string
  comments?: PostComment[] // live/direct replies shown over the story
  reactions?: Record<string, number> // emoji -> live tally (story reaction, item 8)
}

// -------- Komunitas Sehat — interpersonal-relationship health features -----
// All features below run on the locally-shared store (no backend mocking of
// other people) so they work for real accounts/data as soon as they exist.

// 1. Health Buddy — paired accountability partner with a daily check-in streak.
export interface CheckIn {
  email: string
  date: string // yyyy-mm-dd, one per day
}

// 4. Daily mood log + 6. private "send support" one-tap messages.
export interface MoodEntry {
  id: string
  email: string
  name: string
  mood: 'senang' | 'biasa' | 'lelah' | 'sedih' | 'stres'
  note?: string
  at: string
}
export interface SupportMessage {
  id: string
  fromEmail: string
  fromName: string
  toName: string // free-text recipient (buddy/teman/keluarga) — no fake accounts
  text: string
  at: string
}

// 5. Group health challenge with a live leaderboard.
export interface ChallengeParticipant {
  email: string
  name: string
  progress: number
}
export interface Challenge {
  id: string
  title: string
  unit: string
  goal: number
  endsAt: string
  participants: ChallengeParticipant[]
}

// 9. Circle of Care — small trusted group sharing a mood/activity snapshot.
export interface Circle {
  id: string
  name: string
  memberNames: string[] // free-text member names (family/friends), opt-in
}

// 10. Gratitude wall — short public thank-you notes between users.
export interface GratitudeNote {
  id: string
  fromName: string
  toName: string
  text: string
  at: string
}

// 11. Sport communities — small groups discoverable by shared sport interest;
// also the basis for an "affinity score" between members (item 1).
export interface SportCommunity {
  id: string
  name: string
  sportTag: string // e.g. "Lari", "Yoga", "Gym", "Sepeda"
  memberNames: string[]
  createdBy: string // account email
  createdAt: string
}

// -------- Pusat Kesehatan Realtime: edukasi, news, kalkulasi, monitoring ---
// Self-tracked manual vitals log (separate from the clinical multi-patient `vitals` map).
export interface SelfVital {
  id: string
  at: string // ISO datetime
  systolic: number
  diastolic: number
  heartRate: number
  spo2: number
  tempC: number
}

export interface SleepLog {
  id: string
  date: string // yyyy-mm-dd
  hours: number
  bedtimeConsistent: boolean // went to bed within ~1h of usual time
}

export interface MedReminder {
  id: string
  name: string
  time: string // "HH:MM"
  takenDates: string[] // yyyy-mm-dd dates marked taken
}

export interface Vo2MaxEntry {
  id: string
  at: string // ISO datetime
  value: number // mL/kg/min
  method: string // "Tes Cooper", "GPS Aktivitas", "Estimasi HR"
}

export interface HealthGoal {
  id: string
  metric: 'water' | 'sleep' | 'steps' | 'checkin' | 'custom'
  label: string
  target: number
  unit: string
}

// Training Intensity journal — Rate of Perceived Exertion (RPE 1-10) per session.
export interface TrainingLog {
  id: string
  date: string // yyyy-mm-dd
  rpe: number // 1 (sangat ringan) – 10 (maksimal)
  type: string // mis. Lari, Gym, HIIT, Renang
  note?: string
}

// Auto-recorded GPS sport activity (route-based) — values are COMPUTED from GPS
// tracking, never entered manually. Powers competitive charts & leaderboards.
export interface GpsActivity {
  id: string
  email: string
  name: string
  sport: string // display name, e.g. "Lari", "Renang", "Triathlon"
  sportType: string // 'run' | 'cycle' | 'swim' | 'marathon' | 'half_marathon' | 'triathlon' | 'walk'
  emoji: string
  distKm: number
  durSec: number
  avgSpeedKmh: number
  kcal: number
  at: string // ISO datetime
}

// -------- Nutrition / calorie diary ----------------------------------------
export interface FoodEntry {
  id: string
  date: string // yyyy-mm-dd
  name: string
  grams: number
  kcal: number
  carbs: number
  protein: number
  fat: number
}

// -------- Daily wellness log (sleep / water / exercise) for trend chart -----
export interface WellnessDay {
  date: string // yyyy-mm-dd
  sleepHr?: number // hours of sleep
  waterMl?: number // water intake in mL
  exerciseKcal?: number // calories burned via exercise
  exerciseMin?: number // total exercise minutes
  sunDone?: boolean // got sunlight exposure today
  sunHr?: number // hours of sun exposure
  metHours?: number // MET-hours of activity
}

// -------- Doctor consultations --------------------------------------------
export interface ConsultSession {
  id: string
  doctorName: string
  specialty: string
  patientEmail: string
  at: string
  feeIdr: number
  status: 'terjadwal' | 'selesai'
}

// -------- Pharmacy products (editable by admin / registered pharmacy) -------
export type PharmacyCategory = 'Demam & Nyeri' | 'Batuk & Pilek' | 'Lambung' | 'Vitamin' | 'Topikal'
export interface PharmacyProduct {
  id: string
  name: string
  desc: string
  category: PharmacyCategory
  priceIdr: number
  rx: boolean // requires prescription
  emoji: string
  color: string
  image?: string // optional uploaded product photo (data URL)
}

// -------- Editable user profile (name, status/bio, avatar) -----------------
export interface ProfileEdit {
  name?: string
  bio?: string
  avatar?: string // data URL / uploaded photo
  sex?: 'L' | 'P' | '-' // jenis kelamin (L=laki-laki, P=perempuan, -=tidak disebut)
  location?: string // kota/domisili
  profession?: string // pekerjaan/keahlian
  link?: string // tautan/sitasi URL (mis. profil profesional, publikasi)
}

// -------- Unified transactions / order history ----------------------------
export type OrderCategory = 'Obat' | 'Konsultasi' | 'Langganan' | 'Lab' | 'Lainnya'
export interface Order {
  id: string
  category: OrderCategory
  title: string
  detail?: string
  amountIdr: number
  status: 'Diproses' | 'Diterima' | 'Selesai'
  at: string
}

// -------- Simulated email outbox ------------------------------------------
export interface EmailMsg {
  id: string
  to: string
  subject: string
  body: string
  at: string
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

export type MaterialCategory = 'Catatan' | 'Materi' | 'Jurnal' | 'Artikel'
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

export type TxType = 'deposit' | 'purchase' | 'payout' | 'subscription' | 'withdraw' | 'consult'
export type PaymentMethod = 'Visa' | 'QRIS' | 'Virtual Account'
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
  account: Account | null // logged-in account (role-based)
  adminEmails: string[] // emails allowed to sign in as Admin (managed by owner)
  longevitySubExpires?: string // ISO date — AI Longevity score subscription expiry
  chronicSubExpires?: string // ISO date — chronic-care monitoring subscription expiry
  chronicLifetime?: boolean // lifetime chronic-care monitoring access
  authorSubPrices: Record<string, number> // authorEmail -> monthly PNC price
  authorSubs: Record<string, string> // authorEmail -> subscription expiry ISO
  posts: SocialPost[]
  stories: Story[]
  follows: string[] // emails the current account follows
  presence: Record<string, string> // email -> ISO last-active timestamp (online indicator)
  buddyName?: string // accountability Health Buddy (free-text name, item 1)
  checkIns: CheckIn[] // daily accountability check-ins (item 1)
  moods: MoodEntry[] // mood log (item 4)
  supportMessages: SupportMessage[] // private one-tap support notes (items 4 & 6)
  challenges: Challenge[] // group health challenges (item 5)
  circles: Circle[] // Circle of Care groups (item 9)
  gratitudes: GratitudeNote[] // gratitude wall (item 10)
  communities: SportCommunity[] // sport-interest communities (item 10b / affinity basis for item 1)
  selfVitals: SelfVital[] // manual vitals monitoring log (Pusat Kesehatan Realtime)
  sleepLogs: SleepLog[] // sleep quality monitoring
  medReminders: MedReminder[] // medication/vitamin reminders
  eduBookmarks: string[] // bookmarked education article ids
  quizScore: { correct: number; total: number } // myth-vs-fact quiz running score
  vo2maxLog: Vo2MaxEntry[] // VO2Max measurements over time (Cooper test, GPS, HR estimate)
  goals: HealthGoal[] // personal health targets (item 4)
  gpsActivities: GpsActivity[] // auto-recorded GPS sport activities (competitive charts)
  trainingLogs: TrainingLog[] // Training Intensity (RPE) journal
  activeProgram?: string // training program the user is currently following
  foods: FoodEntry[]
  wellness: Record<string, WellnessDay> // daily sleep/water/exercise by date
  consults: ConsultSession[]
  orders: Order[]
  products: PharmacyProduct[]
  profiles: Record<string, ProfileEdit> // by email
  emails: EmailMsg[]
  settings: {
    apiKey: string
    model: string
    doctorName: string
    // Notification preferences
    notifVitals?: boolean
    notifEmail?: boolean
    notifSms?: boolean
    notifAiInsights?: boolean
    notifBroadcasts?: boolean
    notifTransactions?: boolean
    // Security
    twoFactor?: boolean
    biometricLock?: boolean
  }
}
