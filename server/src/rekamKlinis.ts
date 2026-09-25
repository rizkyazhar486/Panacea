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
    // Klinisi: cap identitas & waktu server saat tanda tangan/verifikasi baru.
    if (r.signedAt && !(lama?.signedAt && sama(r.signedAt, lama.signedAt))) {
      r.signedBy = penulis.nama; r.signedById = penulis.id; r.signedAt = kini.toISOString()
    } else if (lama?.signedAt && r.signedAt) {
      r.signedBy = lama.signedBy; r.signedById = lama.signedById; r.signedAt = lama.signedAt
    }
    if (r.physicalExam?.doctorVerified && !(fisikLama.doctorVerified && fisikLama.verifiedById)) {
      r.physicalExam.verifiedBy = penulis.nama; r.physicalExam.verifiedById = penulis.id
    }
  }
  const berubah = lama && !sama(lama, r)
  return { rekam: r, ...(lama?.signedAt && berubah ? { arsip: { ...lama, diarsipkanPada: kini.toISOString(), diarsipkanOleh: penulis.id } } : {}) }
}
