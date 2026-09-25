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

export function terapkanSimpanRekam(lama: any | undefined, baru: any, penulis: Penulis, kini: Date): { rekam: any; arsip?: any } {
  const r = structuredClone(baru ?? {})
  const fisikLama = lama?.physicalExam ?? {}
  if (!penulis.klinisi) {
    // Tidak dapat menandatangani atau memalsukan konten klinisi.
    if (!(lama?.signedAt && sama(r.signedAt, lama.signedAt) && sama(r.signedBy, lama.signedBy) && sama(r.signedById, lama.signedById))) {
      delete r.signedAt; delete r.signedBy; delete r.signedById
    }
    if (r.physicalExam && !(fisikLama.doctorVerified && sama(r.physicalExam.verifiedBy, fisikLama.verifiedBy))) {
      r.physicalExam.doctorVerified = false; delete r.physicalExam.verifiedBy; delete r.physicalExam.verifiedById
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
