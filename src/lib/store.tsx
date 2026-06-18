import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AppState,
  Patient,
  VitalSign,
  SupportiveResult,
  ChatMessage,
  EMRRecord,
  EducationSheet,
  Material,
  Contributor,
  WalletTx,
  Subscription,
  SubscriptionPlan,
  AIReview,
  VerifierReview,
  Account,
  Role,
  SocialPost,
  FoodEntry,
  ConsultSession,
  EmailMsg,
  TxType,
} from './types'

const STORAGE_KEY = 'panaceamed.state.v2'

export const TOKEN_TO_IDR = 1000 // 1 PNC = Rp1.000 (simulasi)
export const PLATFORM_FEE = 0.2 // 20% platform fee on author payout

export function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function seed(): AppState {
  const now = Date.now()
  const ago = (h: number) => new Date(now - h * 3600 * 1000).toISOString()

  const patients: Patient[] = [
    {
      id: 'p1',
      name: 'Bpk. Hartono Wijaya',
      sex: 'L',
      dob: '1952-04-12',
      mrn: 'PMD-000124',
      heightCm: 168,
      weightKg: 78,
      bloodType: 'O+',
      allergies: ['Penisilin'],
      chronicConditions: ['Hipertensi', 'Diabetes Melitus tipe 2'],
      riskFlags: ['chronic', 'elderly'],
      avatarColor: '#00BF63',
    },
    {
      id: 'p2',
      name: 'Ibu Siti Rahayu',
      sex: 'P',
      dob: '1968-09-30',
      mrn: 'PMD-000219',
      heightCm: 156,
      weightKg: 49,
      bloodType: 'B+',
      allergies: [],
      chronicConditions: ['PPOK', 'Riwayat TB paru'],
      riskFlags: ['chronic', 'immunocompromised'],
      avatarColor: '#FF3131',
    },
    {
      id: 'p3',
      name: 'Sdr. Andi Pratama',
      sex: 'L',
      dob: '1995-02-18',
      mrn: 'PMD-000388',
      heightCm: 174,
      weightKg: 92,
      bloodType: 'A+',
      allergies: [],
      chronicConditions: ['Obesitas', 'Dislipidemia'],
      riskFlags: ['chronic'],
      avatarColor: '#0B7A4B',
    },
    {
      id: 'p4',
      name: 'An. Bilal Ramadhan',
      sex: 'L',
      dob: '2018-05-20',
      mrn: 'PMD-000451',
      heightCm: 96,
      weightKg: 12.4,
      bloodType: 'O+',
      allergies: ['Susu sapi'],
      chronicConditions: ['Gizi kurang', 'Asma'],
      riskFlags: ['chronic'],
      avatarColor: '#FF8A3D',
    },
  ]

  const vitals: Record<string, VitalSign[]> = {
    p1: [
      v(ago(72), 158, 96, 88, 18, 36.6, 98, 184),
      v(ago(48), 152, 92, 84, 18, 36.5, 98, 176),
      v(ago(24), 149, 90, 80, 17, 36.7, 99, 168),
      v(ago(3), 145, 88, 78, 16, 36.6, 99, 162),
    ],
    p2: [
      v(ago(50), 118, 74, 96, 24, 37.1, 93, 110),
      v(ago(26), 116, 72, 92, 22, 37.0, 94, 104),
      v(ago(2), 120, 76, 90, 21, 36.9, 95, 99),
    ],
    p3: [v(ago(20), 134, 86, 76, 16, 36.6, 99, 142), v(ago(1), 132, 84, 74, 16, 36.5, 99, 138)],
    p4: [v(ago(30), 95, 60, 104, 24, 36.8, 98), v(ago(4), 96, 62, 100, 22, 36.7, 99)],
  }

  const supportive: Record<string, SupportiveResult[]> = {
    p1: [
      s(ago(24), 'Lab', 'HbA1c', '8.2', '%', '<7.0', 'high'),
      s(ago(24), 'Lab', 'Kreatinin', '1.3', 'mg/dL', '0.7–1.2', 'high'),
      s(ago(24), 'Lab', 'LDL', '156', 'mg/dL', '<100', 'high'),
      s(ago(24), 'EKG', 'EKG 12 lead', 'LVH, sinus rhythm', '', 'Normal', 'high'),
    ],
    p2: [
      s(ago(26), 'Lab', 'Leukosit', '12.4', '10³/µL', '4–11', 'high'),
      s(ago(26), 'Radiologi', 'Rontgen Toraks', 'Hiperinflasi, old fibrosis', '', '', 'high'),
      s(ago(26), 'Lab', 'SpO2 (ruangan)', '94', '%', '>95', 'low'),
    ],
    p3: [
      s(ago(20), 'Lab', 'Trigliserida', '288', 'mg/dL', '<150', 'high'),
      s(ago(20), 'Lab', 'GDP', '108', 'mg/dL', '70–100', 'high'),
    ],
    p4: [
      s(ago(30), 'Lab', 'Hb', '10.8', 'g/dL', '11.5–15.5', 'low'),
      s(ago(30), 'Lab', 'Albumin', '3.2', 'g/dL', '3.8–5.4', 'low'),
    ],
  }

  const contributors: Contributor[] = [
    { id: 'c0', name: 'dr. Pemeriksa', role: 'Dokter', specialty: 'Umum', verified: true, canVerify: false },
    { id: 'c1', name: 'dr. Rina Kusuma, Sp.PD-KGEH', role: 'Subspesialis', specialty: 'Gastroenterohepatologi', verified: true, canVerify: true },
    { id: 'c2', name: 'dr. Bagus Santoso, Sp.A', role: 'Spesialis', specialty: 'Anak', verified: true, canVerify: true },
    { id: 'c3', name: 'dr. Maya Lestari', role: 'Dokter', specialty: 'Umum', verified: false, canVerify: false },
  ]

  const materials: Material[] = [
    mat('m1', 'Pendekatan Diagnosis Nyeri Dada Akut', 'Algoritma triase IGD: ACS vs non-kardiak, interpretasi EKG & troponin.', 'Catatan', 'UKMPPD', 'Kardiologi', 'c1', 'dr. Rina Kusuma, Sp.PD-KGEH', 'PDF', 'nyeri-dada-akut.pdf', 8, 'verified', 156, 4.8, true),
    mat('m2', 'High-Yield Antibiotics for USMLE Step 1', 'Mekanisme, spektrum, efek samping antibiotik beserta mnemonic.', 'Materi', 'USMLE', 'Farmakologi', 'c1', 'dr. Rina Kusuma, Sp.PD-KGEH', 'PowerPoint', 'abx-step1.pptx', 12, 'verified', 203, 4.9, true),
    mat('m3', 'Tata Laksana Gizi Buruk pada Anak (WHO 10 Langkah)', 'Fase stabilisasi–rehabilitasi, F-75/F-100, ReSoMal.', 'Catatan', 'UKMPPD', 'Anak', 'c2', 'dr. Bagus Santoso, Sp.A', 'Word', 'gizi-buruk-anak.docx', 6, 'verified', 98, 4.7, true),
    mat('m4', 'Update Manajemen Sepsis 2024 (Surviving Sepsis)', 'Ringkasan bundle 1-jam, target resusitasi, vasopresor.', 'Jurnal', 'Umum', 'Penyakit Dalam', 'c1', 'dr. Rina Kusuma, Sp.PD-KGEH', 'PDF', 'sepsis-2024.pdf', 15, 'pending-verifier', 0, 0, true),
  ]

  const wallet = {
    balance: 25,
    transactions: [
      { id: uid(), type: 'deposit' as const, amount: 25, note: 'Top-up awal (bonus pendaftaran)', at: ago(100) },
    ] as WalletTx[],
  }

  return {
    patients,
    activePatientId: 'p1',
    vitals,
    supportive,
    chats: { p1: [], p2: [], p3: [], p4: [] },
    records: {},
    education: {},
    materials,
    ownedMaterialIds: ['m1'],
    contributors,
    wallet,
    subscription: { plan: 'none' } as Subscription,
    currentUserId: 'c0',
    account: null,
    posts: [
      post('Ibu Siti Rahayu', 'pasien', 'video', 'Jalan pagi', 'Rutin jalan 30 menit tiap pagi 🌅', '#00BF63', 12),
      post('Sdr. Andi Pratama', 'pasien', 'image', 'Makan sehat', 'Salmon + brokoli, tinggi protein 🥗', '#0B7A4B', 8),
      post('dr. Bagus Santoso, Sp.A', 'dokter', 'image', 'Edukasi', 'Tips tidur cukup untuk imunitas anak 💤', '#3b82f6', 21),
    ],
    follows: [],
    foods: [],
    consults: [],
    emails: [],
    settings: { apiKey: '', model: 'claude-sonnet-4-6', doctorName: 'dr. Pemeriksa' },
  }
}

function post(
  authorName: string,
  role: Role,
  kind: SocialPost['kind'],
  activity: string,
  caption: string,
  mediaColor: string,
  likes: number,
): SocialPost {
  return {
    id: uid(),
    authorEmail: authorName.toLowerCase().replace(/[^a-z]/g, '') + '@panaceamed.id',
    authorName,
    role,
    kind,
    activity,
    caption,
    mediaColor,
    durationSec: kind === 'video' ? 15 : undefined,
    likes,
    at: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
  }
}

function mat(
  id: string,
  title: string,
  description: string,
  category: Material['category'],
  exam: Material['exam'],
  specialty: string,
  authorId: string,
  authorName: string,
  fileType: Material['fileType'],
  fileName: string,
  priceTokens: number,
  status: Material['status'],
  downloads: number,
  rating: number,
  aiApproved: boolean,
): Material {
  const now = new Date().toISOString()
  return {
    id,
    title,
    description,
    category,
    exam,
    specialty,
    authorId,
    authorName,
    fileType,
    fileName,
    priceTokens,
    status,
    downloads,
    rating,
    createdAt: now,
    aiReview: aiApproved
      ? { verdict: 'approved', score: 88, notes: 'Konten akurat & sesuai pedoman terkini.', at: now }
      : undefined,
    verifierReview:
      status === 'verified'
        ? { verifierName: authorName, verifierRole: 'Subspesialis', approved: true, notes: 'Disetujui.', at: now }
        : undefined,
  }
}

function v(
  takenAt: string,
  systolic: number,
  diastolic: number,
  heartRate: number,
  respRate: number,
  tempC: number,
  spo2: number,
  glucose?: number,
): VitalSign {
  return { id: uid(), takenAt, systolic, diastolic, heartRate, respRate, tempC, spo2, glucose }
}

function s(
  takenAt: string,
  category: SupportiveResult['category'],
  name: string,
  value: string,
  unit: string,
  reference: string,
  flag: SupportiveResult['flag'],
): SupportiveResult {
  return { id: uid(), takenAt, category, name, value, unit, reference, flag }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...seed(), ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return seed()
}

interface Store {
  state: AppState
  activePatient: Patient
  currentUser: Contributor
  account: Account | null
  setActivePatient: (id: string) => void
  addPatient: (p: Patient) => void
  addVital: (patientId: string, vital: VitalSign) => void
  addSupportive: (patientId: string, r: SupportiveResult) => void
  setChat: (patientId: string, messages: ChatMessage[]) => void
  saveRecord: (record: EMRRecord) => void
  saveEducation: (patientId: string, sheet: EducationSheet) => void
  updateSettings: (partial: Partial<AppState['settings']>) => void
  resetDemo: () => void
  // marketplace + billing
  setCurrentUser: (id: string) => void
  depositTokens: (amount: number, note: string) => void
  buyMaterial: (materialId: string) => { ok: boolean; reason?: string }
  uploadMaterial: (m: Material) => void
  setMaterialAIReview: (id: string, review: AIReview) => void
  setMaterialVerifierReview: (id: string, review: VerifierReview) => void
  subscribe: (plan: SubscriptionPlan, seats?: number) => void
  // auth
  login: (account: Account) => void
  logout: () => void
  // social + nutrition + consult + email + withdraw
  addPost: (p: SocialPost) => void
  toggleLike: (id: string) => void
  toggleFollow: (email: string) => void
  addFood: (f: FoodEntry) => void
  bookConsult: (c: ConsultSession) => void
  sendEmail: (e: EmailMsg) => void
  withdrawTokens: (amount: number, bank: string) => { ok: boolean; reason?: string }
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const store = useMemo<Store>(() => {
    const activePatient =
      state.patients.find((p) => p.id === state.activePatientId) ?? state.patients[0]
    const currentUser =
      state.contributors.find((c) => c.id === state.currentUserId) ?? state.contributors[0]
    return {
      state,
      activePatient,
      currentUser,
      account: state.account,
      setActivePatient: (id) => setState((st) => ({ ...st, activePatientId: id })),
      addPatient: (p) =>
        setState((st) => ({
          ...st,
          patients: [...st.patients, p],
          vitals: { ...st.vitals, [p.id]: [] },
          supportive: { ...st.supportive, [p.id]: [] },
          chats: { ...st.chats, [p.id]: [] },
          activePatientId: p.id,
        })),
      addVital: (patientId, vital) =>
        setState((st) => ({
          ...st,
          vitals: { ...st.vitals, [patientId]: [...(st.vitals[patientId] ?? []), vital] },
        })),
      addSupportive: (patientId, r) =>
        setState((st) => ({
          ...st,
          supportive: {
            ...st.supportive,
            [patientId]: [...(st.supportive[patientId] ?? []), r],
          },
        })),
      setChat: (patientId, messages) =>
        setState((st) => ({ ...st, chats: { ...st.chats, [patientId]: messages } })),
      saveRecord: (record) =>
        setState((st) => ({ ...st, records: { ...st.records, [record.patientId]: record } })),
      saveEducation: (patientId, sheet) =>
        setState((st) => ({ ...st, education: { ...st.education, [patientId]: sheet } })),
      updateSettings: (partial) =>
        setState((st) => ({ ...st, settings: { ...st.settings, ...partial } })),
      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY)
        setState(seed())
      },
      setCurrentUser: (id) => setState((st) => ({ ...st, currentUserId: id })),
      depositTokens: (amount, note) =>
        setState((st) => ({
          ...st,
          wallet: {
            balance: st.wallet.balance + amount,
            transactions: [
              { id: uid(), type: 'deposit', amount, note, at: new Date().toISOString() },
              ...st.wallet.transactions,
            ],
          },
        })),
      buyMaterial: (materialId) => {
        const m = state.materials.find((x) => x.id === materialId)
        if (!m) return { ok: false, reason: 'Materi tidak ditemukan.' }
        if (state.ownedMaterialIds.includes(materialId)) return { ok: false, reason: 'Sudah dimiliki.' }
        if (state.wallet.balance < m.priceTokens)
          return { ok: false, reason: 'Saldo token tidak cukup. Silakan deposit.' }
        setState((st) => {
          const now = new Date().toISOString()
          const payout = Math.round(m.priceTokens * (1 - PLATFORM_FEE))
          return {
            ...st,
            ownedMaterialIds: [...st.ownedMaterialIds, materialId],
            materials: st.materials.map((x) =>
              x.id === materialId ? { ...x, downloads: x.downloads + 1 } : x,
            ),
            wallet: {
              balance: st.wallet.balance - m.priceTokens,
              transactions: [
                { id: uid(), type: 'purchase', amount: -m.priceTokens, note: `Beli: ${m.title}`, at: now },
                {
                  id: uid(),
                  type: 'payout',
                  amount: payout,
                  note: `Royalti penulis ${m.authorName} (${m.title})`,
                  at: now,
                },
                ...st.wallet.transactions,
              ],
            },
          }
        })
        return { ok: true }
      },
      uploadMaterial: (m) => setState((st) => ({ ...st, materials: [m, ...st.materials] })),
      setMaterialAIReview: (id, review) =>
        setState((st) => ({
          ...st,
          materials: st.materials.map((x) =>
            x.id === id
              ? {
                  ...x,
                  aiReview: review,
                  status: review.verdict === 'approved' ? 'pending-verifier' : 'rejected',
                }
              : x,
          ),
        })),
      setMaterialVerifierReview: (id, review) =>
        setState((st) => ({
          ...st,
          materials: st.materials.map((x) =>
            x.id === id
              ? { ...x, verifierReview: review, status: review.approved ? 'verified' : 'rejected' }
              : x,
          ),
        })),
      login: (account) => setState((st) => ({ ...st, account })),
      logout: () => setState((st) => ({ ...st, account: null })),
      addPost: (p) => setState((st) => ({ ...st, posts: [p, ...st.posts] })),
      toggleLike: (id) =>
        setState((st) => ({
          ...st,
          posts: st.posts.map((p) =>
            p.id === id
              ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
              : p,
          ),
        })),
      toggleFollow: (email) =>
        setState((st) => ({
          ...st,
          follows: st.follows.includes(email)
            ? st.follows.filter((e) => e !== email)
            : [...st.follows, email],
        })),
      addFood: (f) => setState((st) => ({ ...st, foods: [f, ...st.foods] })),
      bookConsult: (c) =>
        setState((st) => ({
          ...st,
          consults: [c, ...st.consults],
          wallet: {
            balance: st.wallet.balance,
            transactions: [
              {
                id: uid(),
                type: 'consult' as TxType,
                amount: 0,
                note: `Konsultasi ${c.doctorName} — Rp${c.feeIdr.toLocaleString('id-ID')} (dibayar)`,
                at: c.at,
              },
              ...st.wallet.transactions,
            ],
          },
        })),
      sendEmail: (e) => setState((st) => ({ ...st, emails: [e, ...st.emails] })),
      withdrawTokens: (amount, bank) => {
        if (amount <= 0) return { ok: false, reason: 'Jumlah tidak valid.' }
        if (state.wallet.balance < amount) return { ok: false, reason: 'Saldo tidak cukup.' }
        setState((st) => ({
          ...st,
          wallet: {
            balance: st.wallet.balance - amount,
            transactions: [
              {
                id: uid(),
                type: 'withdraw' as TxType,
                amount: -amount,
                note: `Tarik dana ke ${bank} (Rp${(amount * TOKEN_TO_IDR).toLocaleString('id-ID')})`,
                at: new Date().toISOString(),
              },
              ...st.wallet.transactions,
            ],
          },
        }))
        return { ok: true }
      },
      subscribe: (plan, seats) =>
        setState((st) => {
          const price = plan === 'individu' ? 20 : plan === 'rumah-sakit' ? 200 : 0
          const txs: WalletTx[] =
            price > 0
              ? [
                  {
                    id: uid(),
                    type: 'subscription',
                    amount: -price,
                    note: `Langganan ${plan === 'individu' ? 'Individu' : 'Rumah Sakit'} / bulan`,
                    at: new Date().toISOString(),
                  },
                ]
              : []
          return {
            ...st,
            subscription: { plan, since: new Date().toISOString(), seats },
            wallet:
              price > 0 && st.wallet.balance >= price
                ? { balance: st.wallet.balance - price, transactions: [...txs, ...st.wallet.transactions] }
                : st.wallet,
          }
        }),
    }
  }, [state])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
