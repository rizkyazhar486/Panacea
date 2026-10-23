import type { Role } from '../../lib/types'

export interface LoginRoleOption {
  id: Role
  title: string
  desc: string
}

export const STR_ROLES: Role[] = ['dokter', 'kontributor', 'verifikator']

export const ROLES: LoginRoleOption[] = [
  { id: 'pasien', title: 'Pasien & Umum', desc: 'Dasbor gaya hidup sehat, asisten edukasi kesehatan, gizi & longevity, konsultasi, serta fasilitas farmasi.' },
  { id: 'dokter', title: 'Dokter / Klinisi', desc: 'Akses modul AI-EMR, perencanaan klinis, dan konsultasi pasien berizin.' },
  { id: 'kontributor', title: 'Kontributor Medis', desc: 'Penulisan, kurasi, dan telaah materi edukasi kesehatan bersama tim verifikator.' },
  { id: 'verifikator', title: 'Verifikator Jurnal', desc: 'Penelaahan pustaka medis ilmiah dan validasi materi berbasis bukti.' },
  { id: 'admin', title: 'Admin / Dukungan', desc: 'Pengelolaan operasional platform dan koordinasi bantuan pengguna.' },
  { id: 'owner', title: 'Manajemen / Owner', desc: 'Pemantauan metrik operasional dan pertumbuhan platform.' },
]

export const LOGIN_PILLS: string[] = [
  'AI-EMR Terpadu',
  'Estimasi Longevity',
  'Pemantauan Vitalitas',
  'Farmasi Digital',
]
