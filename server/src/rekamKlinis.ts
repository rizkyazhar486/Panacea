// Integritas rekam AI-EMR di server.
//
// Sebelumnya server menyimpan rekam apa adanya dari klien: tanda tangan hanyalah
// nama `signedBy` pilihan klien, dan simpanan berikutnya menimpa rekam yang sudah
// ditandatangani tanpa jejak. Aturan sekarang:
// 1. Hanya klinisi terverifikasi yang dapat menandatangani / memverifikasi
//    pemeriksaan fisik / menetapkan diagnosis bersumber 'Dokter'. Dari pengguna
//    lain, field itu DIBUANG (tidak bisa dipalsukan), kecuali sama persis dengan
//    yang sudah tersimpan.
// 2. Identitas penanda tangan & waktunya dicap SERVER (nama & id pengguna yang
//    login, jam server), bukan nama yang dikirim klien.
// 3. Rekam yang sudah ditandatangani tidak pernah hilang: setiap simpanan yang
//    mengubahnya mengarsipkan versi bertanda tangan itu ke riwayat (append-only).
export interface Penulis { id: string; nama: string; klinisi: boolean }

const sama = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

// Persetujuan pasien adalah satu-satunya bagian dari rekam bertanda tangan yang
// boleh berubah tanpa membatalkan cap klinisi. Ia pasien-authored, bukan isi
// klinis yang dokter tandatangani. Semua perubahan lain harus membuat record
// baru kembali unsigned sampai ditinjau dokter lagi.
function tanpaPersetujuanPasien(value: any) {
  const copy = structuredClone(value ?? {})
  if (copy.surgery && typeof copy.surgery === 'object' && !Array.isArray(copy.surgery)) {
    delete copy.surgery.consent
    if (Object.keys(copy.surgery).length === 0) delete copy.surgery
  }
  return copy
}

function isiKlinisTetapSama(lama: any, baru: any) {
  return sama(tanpaPersetujuanPasien(lama), tanpaPersetujuanPasien(baru))
}

function tanpaCapVerifikasiFisik(value: any) {
  const copy = structuredClone(value ?? {})
  delete copy.doctorVerified
  delete copy.verifiedBy
  delete copy.verifiedById
  return copy
}

function isiFisikTetapSama(lama: any, baru: any) {
  return sama(tanpaCapVerifikasiFisik(lama), tanpaCapVerifikasiFisik(baru))
}

function tanpaCapKlinis(value: any) {
  const copy = tanpaPersetujuanPasien(value)
  delete copy.signedAt
  delete copy.signedBy
  delete copy.signedById
  if (copy.physicalExam) copy.physicalExam = tanpaCapVerifikasiFisik(copy.physicalExam)
  return copy
}

function isiTertandaTetapSama(lama: any, baru: any) {
  return sama(tanpaCapKlinis(lama), tanpaCapKlinis(baru))
}

// Asal per butir (masalah & rencana). Butir yang baru atau berubah mengambil asal
// dari PENULIS yang terautentikasi, bukan dari klien:
// - non-klinisi: masalah -> source 'AI'; rencana -> source 'AI', status 'usulan',
//   verifikasi dihapus. Butir identik dengan versi server sebelumnya dibiarkan.
// - klinisi: klien boleh menurunkan asal ke 'AI' (mis. draf pipeline AI yang
//   disimpan dari sesi dokter) — itu bukan eskalasi; selain itu 'Dokter'. Rencana
//   yang (menjadi) 'diverifikasi' dicap verifiedById/verifiedAt oleh server.
function terapkanAsalPerButir(lama: any | undefined, r: any, penulis: Penulis, kini: Date) {
  const petaLama = (xs: any) => new Map<string, any>((Array.isArray(xs) ? xs : []).map((x: any) => [String(x?.id), x]))
  const masalahLama = petaLama(lama?.problems), rencanaLama = petaLama(lama?.plan)
  if (Array.isArray(r.problems)) r.problems = r.problems.map((m: any) => {
    const l = masalahLama.get(String(m?.id))
    if (l && sama(l, m)) return m
    const tanpaAsal = (x: any) => { const { source: _s, ...isi } = x ?? {}; return isi }
    // Hanya label asal yang berbeda (isi sama): tidak ada eskalasi ke 'Dokter'.
    if (l && sama(tanpaAsal(l), tanpaAsal(m))) return { ...m, source: m?.source === 'AI' || l.source !== 'Dokter' ? 'AI' : 'Dokter' }
    // Klinisi mengubah isi butir yang sudah ada = tulisan dokter; butir BARU boleh dinyatakan 'AI'.
    return { ...m, source: penulis.klinisi && (l || m?.source !== 'AI') ? 'Dokter' : 'AI' }
  })
  if (Array.isArray(r.plan)) r.plan = r.plan.map((b: any) => {
    const l = rencanaLama.get(String(b?.id))
    if (l && sama(l, b)) return b
    const { verifiedById: _a, verifiedAt: _b, ...isi } = b ?? {}
    if (!penulis.klinisi) return { ...isi, source: 'AI', status: 'usulan' }
    const teksBerubah = Boolean(l) && !(sama(l.text, b.text) && sama(l.category, b.category))
    const out: any = { ...isi, source: teksBerubah || isi.source !== 'AI' ? 'Dokter' : 'AI' }
    if (isi.status === 'diverifikasi') {
      const tetap = l?.status === 'diverifikasi' && sama(l.text, b.text) && sama(l.category, b.category) && l.verifiedById
      out.verifiedById = tetap ? l.verifiedById : penulis.id
      out.verifiedAt = tetap ? l.verifiedAt : kini.toISOString()
    }
    return out
  })
}

export function terapkanSimpanRekam(lama: any | undefined, baru: any, penulis: Penulis, kini: Date): { rekam: any; arsip?: any } {
  const r = structuredClone(baru ?? {})
  const fisikLama = lama?.physicalExam ?? {}
  if (!penulis.klinisi) {
    // Cap tanda tangan hanya tetap bila cap itu sendiri identik DAN isi klinis
    // tidak berubah. Tanpa aturan kedua ini, pasien dapat mengubah anamnesis /
    // diagnosis / plan sambil membawa signedById lama ke isi baru.
    const capSama = Boolean(
      lama?.signedAt &&
      sama(r.signedAt, lama.signedAt) &&
      sama(r.signedBy, lama.signedBy) &&
      sama(r.signedById, lama.signedById)
    )
    if (!(capSama && isiKlinisTetapSama(lama, r))) {
      delete r.signedAt; delete r.signedBy; delete r.signedById
    }
    if (r.physicalExam) {
      const capFisikSama = Boolean(
        fisikLama.doctorVerified &&
        r.physicalExam.doctorVerified &&
        sama(r.physicalExam.verifiedBy, fisikLama.verifiedBy) &&
        sama(r.physicalExam.verifiedById, fisikLama.verifiedById)
      )
      if (!(capFisikSama && isiFisikTetapSama(fisikLama, r.physicalExam))) {
        r.physicalExam.doctorVerified = false
        delete r.physicalExam.verifiedBy
        delete r.physicalExam.verifiedById
      }
    }
    if (r.primaryDiagnosis?.source === 'Dokter' && !sama(r.primaryDiagnosis, lama?.primaryDiagnosis)) r.primaryDiagnosis.source = 'AI'
  } else {
    // Klinisi: perubahan signedAt dari klien hanyalah INTENT untuk re-sign;
    // identitas dan waktu final tetap dicap server. Bila klinisi hanya Save
    // setelah mengubah isi tetapi membawa signedAt lama, cap lama dibatalkan.
    const memintaTandaTanganBaru = Boolean(
      r.signedAt && !(lama?.signedAt && sama(r.signedAt, lama.signedAt))
    )
    const membawaTandaTanganLama = Boolean(
      lama?.signedAt && r.signedAt && sama(r.signedAt, lama.signedAt)
    )
    if (memintaTandaTanganBaru) {
      r.signedBy = penulis.nama
      r.signedById = penulis.id
      r.signedAt = kini.toISOString()
    } else if (membawaTandaTanganLama) {
      if (isiTertandaTetapSama(lama, r)) {
        r.signedBy = lama.signedBy
        r.signedById = lama.signedById
        r.signedAt = lama.signedAt
      } else {
        delete r.signedAt
        delete r.signedBy
        delete r.signedById
      }
    }

    if (r.physicalExam?.doctorVerified) {
      const fisikBerubah = !isiFisikTetapSama(fisikLama, r.physicalExam)
      if (memintaTandaTanganBaru || !fisikLama.doctorVerified) {
        r.physicalExam.verifiedBy = penulis.nama
        r.physicalExam.verifiedById = penulis.id
      } else if (fisikBerubah) {
        r.physicalExam.doctorVerified = false
        delete r.physicalExam.verifiedBy
        delete r.physicalExam.verifiedById
      } else {
        r.physicalExam.verifiedBy = fisikLama.verifiedBy
        r.physicalExam.verifiedById = fisikLama.verifiedById
      }
    }
  }
  terapkanAsalPerButir(lama, r, penulis, kini)
  const berubah = lama && !sama(lama, r)
  return { rekam: r, ...(lama?.signedAt && berubah ? { arsip: { ...lama, diarsipkanPada: kini.toISOString(), diarsipkanOleh: penulis.id } } : {}) }
}

// Kunjungan (encounter). Satu pasien memiliki SATU draf aktif dan daftar
// kunjungan tertutup yang tidak dapat diubah. Menutup kunjungan:
// - hanya klinisi/pemilik;
// - hanya rekam yang SUDAH ditandatangani server (signedById + signedAt), sehingga
//   draf AI atau isi yang belum ditinjau tidak pernah dibekukan sebagai kunjungan;
// - draf baru hanya membawa DAFTAR MASALAH (ditandai carriedFrom) — bukan diagnosis,
//   rencana, pemeriksaan fisik atau tanda tangan, karena itu milik kunjungan lama.
export type HasilTutupKunjungan =
  | { ok: true; kunjungan: any; rekamBaru: any }
  | { ok: false; alasan: 'not-clinician' | 'no-record' | 'not-signed' }

export function tutupKunjungan(lama: any | undefined, penulis: Penulis, kini: Date, idBaru: string): HasilTutupKunjungan {
  if (!penulis.klinisi) return { ok: false, alasan: 'not-clinician' }
  if (!lama) return { ok: false, alasan: 'no-record' }
  if (!lama.signedAt || !lama.signedById) return { ok: false, alasan: 'not-signed' }
  const t = kini.toISOString()
  const kunjungan = { ...structuredClone(lama), encounterId: lama.id, closedAt: t, closedById: penulis.id, closedBy: penulis.nama }
  const rekamBaru = {
    id: idBaru, patientId: lama.patientId, createdAt: t, updatedAt: t,
    // Bentuk lengkap (string kosong) agar klien tidak menerima field undefined.
    anamnesis: Object.fromEntries(['keluhanUtama', 'rps', 'rpd', 'rpk', 'riwayatKehamilan', 'riwayatPengobatan', 'riwayatAlergi', 'riwayatTumbuhKembang', 'riwayatNutrisi', 'riwayatImunisasi', 'riwayatSosialEkonomi'].map((k) => [k, ''])),
    physicalExam: { general: '', vitalsNote: '', perSystem: '', doctorVerified: false },
    problems: (lama.problems ?? []).map((p: any) => ({ ...structuredClone(p), carriedFrom: lama.id })),
    plan: [], references: [], previousEncounterId: lama.id,
  }
  return { ok: true, kunjungan, rekamBaru }
}
