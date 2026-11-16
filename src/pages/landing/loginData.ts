import type { Role } from '../../lib/types'

export interface LoginRoleOption {
  id: Role
  title: string
  desc: string
}

export const STR_ROLES: Role[] = ['dokter', 'kontributor', 'verifikator']

export const ROLES: LoginRoleOption[] = [
  { id: 'pasien', title: 'Pasien & Umum', desc: 'Dasbor gaya hidup sehat, rekam medis pribadi terisolasi, wearable 25 perangkat, dan Kartu EMV Health Pass.' },
  { id: 'dokter', title: 'Dokter / Klinisi', desc: 'Akses penuh ruang kerja AI-EMR, tinjauan SOAP/SBAR pasien berizin, kalkulator subspesialis & cek interaksi obat.' },
  { id: 'admin', title: 'Faskes / Klinik / RS', desc: 'Pengelolaan operasional fasilitas kesehatan, antrean triase pasien nyata, dan interoperabilitas SATUSEHAT FHIR R4.' },
  { id: 'kontributor', title: 'Kontributor Medis', desc: 'Penulisan, kurasi, dan telaah materi edukasi kesehatan bersama tim verifikator.' },
  { id: 'verifikator', title: 'Verifikator Jurnal', desc: 'Penelaahan pustaka medis ilmiah dan validasi materi berbasis bukti.' },
  { id: 'owner', title: 'Manajemen / Owner', desc: 'Pemantauan metrik operasional dan pertumbuhan platform.' },
]

export const LOGIN_PILLS: string[] = [
  'AI-EMR Terpadu',
  'Estimasi Longevity',
  'Pemantauan Vitalitas',
  'Farmasi Digital',
]
