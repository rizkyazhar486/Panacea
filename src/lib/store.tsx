import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type {
  AppState,
  Patient,
  VitalSign,
  SupportiveResult,
  ChatMessage,
  EMRRecord,
} from './types'

const STORAGE_KEY = 'panaceamed.state.v1'

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
  }

  return {
    patients,
    activePatientId: 'p1',
    vitals,
    supportive,
    chats: { p1: [], p2: [], p3: [] },
    records: {},
    settings: { apiKey: '', model: 'claude-sonnet-4-6', doctorName: 'dr. Pemeriksa' },
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
  setActivePatient: (id: string) => void
  addPatient: (p: Patient) => void
  addVital: (patientId: string, vital: VitalSign) => void
  addSupportive: (patientId: string, r: SupportiveResult) => void
  setChat: (patientId: string, messages: ChatMessage[]) => void
  saveRecord: (record: EMRRecord) => void
  updateSettings: (partial: Partial<AppState['settings']>) => void
  resetDemo: () => void
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
    return {
      state,
      activePatient,
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
      updateSettings: (partial) =>
        setState((st) => ({ ...st, settings: { ...st.settings, ...partial } })),
      resetDemo: () => {
        localStorage.removeItem(STORAGE_KEY)
        setState(seed())
      },
    }
  }, [state])

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
