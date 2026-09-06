// ─────────────────────────────────────────────────────────────────────────────
// JALUR SINYAL — dari mutasi ke akibatnya, dihitung, bukan digambar.
//
// Tiap jalur adalah graf berarah: simpul adalah protein dengan tingkat
// keaktifan 0..1, sisi adalah pengaruh (mengaktifkan atau menghambat) dengan
// bobotnya. Keaktifan dihitung dengan menjalarkan sinyal menurut urutan
// topologis, sehingga hasilnya deterministik dan bisa diuji dengan angka.
//
// Yang membuat model sesederhana ini tetap berguna: ia menjawab pertanyaan
// klinis yang benar-benar ditanyakan — kalau mutasinya di HILIR sasaran obat,
// obat itu tidak akan menolong. Itulah sebabnya antibodi anti-EGFR gagal pada
// kanker kolorektal ber-mutasi KRAS, dan model ini menunjukkannya sebagai
// angka, bukan sebagai kalimat yang harus dipercaya.
//
// Yang TIDAK dimodelkan: kinetika, umpan balik bergantung waktu, dan dosis.
// Ini peta pengambilan keputusan, bukan simulasi biokimia.
// ─────────────────────────────────────────────────────────────────────────────

export interface SimpulJalur {
  id: string
  label: string
  /** Lapisan tampilan: 0 = reseptor di membran, makin besar makin ke inti sel. */
  lapisan: number
  jenis: 'receptor' | 'kinase' | 'gtpase' | 'transcription' | 'outcome' | 'adaptor'
  /** Keaktifan dasar tanpa rangsangan apa pun, 0..1. */
  dasar: number
  keterangan: string
}

export interface SisiJalur {
  dari: string
  ke: string
  /** 1 = mengaktifkan, -1 = menghambat. */
  tanda: 1 | -1
  bobot: number
}

export interface Jalur {
  id: string
  label: string
  ringkas: string
  simpul: SimpulJalur[]
  sisi: SisiJalur[]
  /** Obat yang menyerang simpul tertentu pada jalur ini. */
  penghambat: Array<{ id: string; label: string; simpul: string; efikasi: number; catatan: string }>
  /** Mutasi yang mengunci satu simpul menjadi aktif terus. */
  mutasi: Array<{ id: string; label: string; simpul: string; varian?: string; catatan: string }>
}

export const JALUR: Jalur[] = [
  {
    id: 'ras-mapk',
    label: 'RAS–MAPK',
    ringkas: 'Growth-factor signalling from the membrane to the nucleus — the pathway most often hijacked in cancer.',
    simpul: [
      { id: 'egf', label: 'EGF ligand', lapisan: 0, jenis: 'adaptor', dasar: 0.12, keterangan: 'Growth factor arriving at the cell surface.' },
      { id: 'egfr', label: 'EGFR', lapisan: 1, jenis: 'receptor', dasar: 0.02, keterangan: 'Receptor tyrosine kinase; dimerises and autophosphorylates on ligand binding.' },
      { id: 'grb2', label: 'GRB2–SOS', lapisan: 2, jenis: 'adaptor', dasar: 0.02, keterangan: 'Adaptor that recruits the exchange factor which loads RAS with GTP.' },
      { id: 'kras', label: 'KRAS', lapisan: 3, jenis: 'gtpase', dasar: 0.02, keterangan: 'Molecular switch: active when GTP-bound, off when GAPs make it hydrolyse GTP.' },
      { id: 'braf', label: 'BRAF', lapisan: 4, jenis: 'kinase', dasar: 0.02, keterangan: 'First kinase of the cascade; activated by RAS-GTP.' },
      { id: 'mek', label: 'MEK1/2', lapisan: 5, jenis: 'kinase', dasar: 0.02, keterangan: 'Dual-specificity kinase, the only known substrate of which is ERK.' },
      { id: 'erk', label: 'ERK1/2', lapisan: 6, jenis: 'kinase', dasar: 0.02, keterangan: 'Enters the nucleus and phosphorylates transcription factors.' },
      { id: 'myc', label: 'MYC / cyclin D', lapisan: 7, jenis: 'transcription', dasar: 0.03, keterangan: 'Transcriptional programme that commits the cell to divide.' },
      { id: 'proliferasi', label: 'Proliferation', lapisan: 8, jenis: 'outcome', dasar: 0.05, keterangan: 'The output that matters clinically: cell division.' },
    ],
    sisi: [
      { dari: 'egf', ke: 'egfr', tanda: 1, bobot: 1 },
      { dari: 'egfr', ke: 'grb2', tanda: 1, bobot: 1 },
      { dari: 'grb2', ke: 'kras', tanda: 1, bobot: 1 },
      { dari: 'kras', ke: 'braf', tanda: 1, bobot: 1 },
      { dari: 'braf', ke: 'mek', tanda: 1, bobot: 1 },
      { dari: 'mek', ke: 'erk', tanda: 1, bobot: 1 },
      { dari: 'erk', ke: 'myc', tanda: 1, bobot: 1 },
      { dari: 'myc', ke: 'proliferasi', tanda: 1, bobot: 1 },
      // Umpan balik negatif ERK ke SOS: sebab sebagian penghambat gagal jangka panjang.
      { dari: 'erk', ke: 'grb2', tanda: -1, bobot: 0.3 },
    ],
    penghambat: [
      { id: 'cetuximab', label: 'Anti-EGFR antibody', simpul: 'egfr', efikasi: 0.9, catatan: 'Blocks the receptor — useless if the mutation is downstream of it.' },
      { id: 'sotorasib', label: 'KRAS G12C inhibitor', simpul: 'kras', efikasi: 0.8, catatan: 'Covalent, and only works on the G12C cysteine.' },
      { id: 'vemurafenib', label: 'BRAF inhibitor', simpul: 'braf', efikasi: 0.85, catatan: 'Effective in BRAF V600E; paradoxically activates the pathway in BRAF wild-type cells.' },
      { id: 'trametinib', label: 'MEK inhibitor', simpul: 'mek', efikasi: 0.8, catatan: 'Downstream of both RAS and RAF, so it works regardless of which of them is mutated.' },
    ],
    mutasi: [
      { id: 'egfr-l858r', label: 'EGFR L858R', simpul: 'egfr', varian: 'egfr-l858r', catatan: 'Receptor active without ligand.' },
      { id: 'kras-g12c', label: 'KRAS G12C', simpul: 'kras', varian: 'kras-g12c', catatan: 'GTP hydrolysis blocked — the switch cannot turn off.' },
      { id: 'braf-v600e', label: 'BRAF V600E', simpul: 'braf', varian: 'braf-v600e', catatan: 'Signals as a monomer without RAS input.' },
    ],
  },
  {
    id: 'jak-stat',
    label: 'JAK–STAT',
    ringkas: 'How cytokine and erythropoietin signals reach the nucleus — and what JAK2 V617F breaks.',
    simpul: [
      { id: 'epo', label: 'Erythropoietin', lapisan: 0, jenis: 'adaptor', dasar: 0.3, keterangan: 'Renal hormone that tells marrow to make red cells.' },
      { id: 'epor', label: 'EPO receptor', lapisan: 1, jenis: 'receptor', dasar: 0.02, keterangan: 'Cytokine receptor with no intrinsic kinase activity.' },
      { id: 'jak2', label: 'JAK2', lapisan: 2, jenis: 'kinase', dasar: 0.02, keterangan: 'The receptor-associated kinase; its pseudokinase domain restrains it.' },
      { id: 'stat5', label: 'STAT5', lapisan: 3, jenis: 'transcription', dasar: 0.02, keterangan: 'Phosphorylated by JAK2, dimerises and enters the nucleus.' },
      { id: 'eritropoiesis', label: 'Erythropoiesis', lapisan: 4, jenis: 'outcome', dasar: 0.05, keterangan: 'Red cell production — raised haematocrit when it runs unchecked.' },
    ],
    sisi: [
      { dari: 'epo', ke: 'epor', tanda: 1, bobot: 1 },
      { dari: 'epor', ke: 'jak2', tanda: 1, bobot: 1 },
      { dari: 'jak2', ke: 'stat5', tanda: 1, bobot: 1 },
      { dari: 'stat5', ke: 'eritropoiesis', tanda: 1, bobot: 1 },
    ],
    penghambat: [
      { id: 'ruxolitinib', label: 'JAK inhibitor', simpul: 'jak2', efikasi: 0.75, catatan: 'Blocks the kinase whether or not it carries V617F.' },
    ],
    mutasi: [
      { id: 'jak2-v617f', label: 'JAK2 V617F', simpul: 'jak2', varian: 'jak2-v617f', catatan: 'Loses pseudokinase restraint and signals without erythropoietin — which is why the EPO level is low.' },
    ],
  },
  {
    id: 'bcr-abl',
    label: 'BCR–ABL1',
    ringkas: 'One fused kinase driving an entire leukaemia — and the first proof that targeting it works.',
    simpul: [
      { id: 'bcrabl', label: 'BCR::ABL1', lapisan: 0, jenis: 'kinase', dasar: 0.02, keterangan: 'Fusion kinase forced into a dimer, permanently on.' },
      { id: 'crkl', label: 'CRKL', lapisan: 1, jenis: 'adaptor', dasar: 0.02, keterangan: 'Substrate whose phosphorylation is used to measure pathway activity.' },
      { id: 'stat5b', label: 'STAT5', lapisan: 2, jenis: 'transcription', dasar: 0.02, keterangan: 'Drives survival and proliferation signals.' },
      { id: 'mieloid', label: 'Myeloid expansion', lapisan: 3, jenis: 'outcome', dasar: 0.05, keterangan: 'The granulocyte expansion of chronic myeloid leukaemia.' },
    ],
    sisi: [
      { dari: 'bcrabl', ke: 'crkl', tanda: 1, bobot: 1 },
      { dari: 'crkl', ke: 'stat5b', tanda: 1, bobot: 1 },
      { dari: 'stat5b', ke: 'mieloid', tanda: 1, bobot: 1 },
    ],
    penghambat: [
      { id: 'imatinib', label: 'Imatinib', simpul: 'bcrabl', efikasi: 0.9, catatan: 'Binds the inactive conformation; defeated by the T315I gatekeeper change.' },
      { id: 'ponatinib', label: 'Ponatinib', simpul: 'bcrabl', efikasi: 0.85, catatan: 'Designed to accommodate the bulky gatekeeper isoleucine.' },
    ],
    mutasi: [
      { id: 'bcr-abl1', label: 'BCR::ABL1 fusion', simpul: 'bcrabl', varian: 'bcr-abl1', catatan: 'Present in essentially every case of CML.' },
    ],
  },
  {
    id: 'pi3k-akt',
    label: 'PI3K–AKT–mTOR',
    ringkas: 'The growth and survival arm — and where PTEN loss removes the brake.',
    simpul: [
      { id: 'rtk', label: 'Receptor kinase', lapisan: 0, jenis: 'receptor', dasar: 0.1, keterangan: 'Any growth factor receptor feeding this arm.' },
      { id: 'pi3k', label: 'PI3K', lapisan: 1, jenis: 'kinase', dasar: 0.02, keterangan: 'Converts PIP2 to PIP3 at the membrane.' },
      { id: 'pten', label: 'PTEN', lapisan: 2, jenis: 'kinase', dasar: 0.8, keterangan: 'The phosphatase that reverses PI3K — a brake, not an accelerator.' },
      { id: 'akt', label: 'AKT', lapisan: 3, jenis: 'kinase', dasar: 0.02, keterangan: 'Recruited to PIP3 and activated; drives survival.' },
      { id: 'mtor', label: 'mTORC1', lapisan: 4, jenis: 'kinase', dasar: 0.03, keterangan: 'Master regulator of protein synthesis and cell growth.' },
      { id: 'pertumbuhan', label: 'Growth & survival', lapisan: 5, jenis: 'outcome', dasar: 0.05, keterangan: 'Cell size, protein synthesis, resistance to apoptosis.' },
    ],
    sisi: [
      { dari: 'rtk', ke: 'pi3k', tanda: 1, bobot: 1 },
      { dari: 'pi3k', ke: 'akt', tanda: 1, bobot: 1 },
      { dari: 'pten', ke: 'akt', tanda: -1, bobot: 0.9 },
      { dari: 'akt', ke: 'mtor', tanda: 1, bobot: 1 },
      { dari: 'mtor', ke: 'pertumbuhan', tanda: 1, bobot: 1 },
    ],
    penghambat: [
      { id: 'everolimus', label: 'mTOR inhibitor', simpul: 'mtor', efikasi: 0.8, catatan: 'Acts below AKT, so it still works when the lesion is upstream.' },
      { id: 'alpelisib', label: 'PI3K inhibitor', simpul: 'pi3k', efikasi: 0.8, catatan: 'Still depends on flux through PI3K, so PTEN-null tumours tend to respond less than PIK3CA-mutant ones.' },
    ],
    mutasi: [
      { id: 'pten-loss', label: 'PTEN loss', simpul: 'pten', catatan: 'Loss of the brake — modelled as the node being forced OFF, not on.' },
      { id: 'pik3ca', label: 'PIK3CA activating mutation', simpul: 'pi3k', catatan: 'Accelerator stuck down.' },
    ],
  },
]

export interface KeadaanJalur {
  /** id mutasi yang menyala. */
  mutasi: string[]
  /** id penghambat yang diberikan. */
  obat: string[]
}

export interface HasilJalur {
  aktivasi: Record<string, number>
  /** Keaktifan simpul keluaran (jenis 'outcome'). */
  keluaran: number
  /** Keluaran tanpa mutasi maupun obat — pembanding. */
  keluaranDasar: number
}

/**
 * Hitung keaktifan tiap simpul.
 *
 * Aturannya sengaja sedikit dan jelas:
 *   - simpul yang dimutasikan dikunci menjadi 1 (aktif terus), kecuali mutasi
 *     yang berupa KEHILANGAN penghambat, yang dikunci menjadi 0;
 *   - penghambat mengalikan keaktifan simpulnya dengan (1 - efikasi);
 *   - selain itu, keaktifan simpul adalah keaktifan dasarnya ditambah jumlah
 *     masukan yang mengaktifkan dan dikurangi masukan yang menghambat, dibatasi
 *     pada rentang 0..1.
 *
 * Penjalaran mengikuti urutan lapisan, jadi hasilnya tidak bergantung pada
 * urutan penulisan simpul di dalam berkas ini.
 */
export function hitungJalur(jalur: Jalur, keadaan: KeadaanJalur): HasilJalur {
  const hitung = (aktifMutasi: string[], aktifObat: string[]): Record<string, number> => {
    const nilai: Record<string, number> = {}
    const urut = [...jalur.simpul].sort((a, b) => a.lapisan - b.lapisan)
    const mutasiSimpul = new Map<string, boolean>()   // simpul -> dikunci aktif?
    for (const m of jalur.mutasi) {
      if (!aktifMutasi.includes(m.id)) continue
      // Mutasi pada simpul yang perannya MENGHAMBAT (mis. PTEN) berarti
      // kehilangan rem: simpulnya dimatikan, bukan dinyalakan.
      const menghambat = jalur.sisi.some((s) => s.dari === m.simpul && s.tanda === -1)
      mutasiSimpul.set(m.simpul, !menghambat)
    }
    const obatSimpul = new Map<string, number>()
    for (const o of jalur.penghambat) {
      if (!aktifObat.includes(o.id)) continue
      obatSimpul.set(o.simpul, Math.max(obatSimpul.get(o.simpul) ?? 0, o.efikasi))
    }

    for (const s of urut) {
      let v: number
      if (mutasiSimpul.has(s.id)) {
        v = mutasiSimpul.get(s.id) ? 1 : 0
      } else {
        v = s.dasar
        for (const e of jalur.sisi) {
          if (e.ke !== s.id) continue
          const sumber = nilai[e.dari] ?? jalur.simpul.find((x) => x.id === e.dari)?.dasar ?? 0
          v += e.tanda * e.bobot * sumber
        }
      }
      const hambat = obatSimpul.get(s.id)
      if (hambat !== undefined) v *= 1 - hambat
      nilai[s.id] = Number(Math.min(1, Math.max(0, v)).toFixed(4))
    }
    return nilai
  }

  const aktivasi = hitung(keadaan.mutasi, keadaan.obat)
  const dasar = hitung([], [])
  const idKeluaran = jalur.simpul.filter((s) => s.jenis === 'outcome').map((s) => s.id)
  const rata = (n: Record<string, number>) =>
    idKeluaran.length ? Number((idKeluaran.reduce((a, b) => a + (n[b] ?? 0), 0) / idKeluaran.length).toFixed(4)) : 0

  return { aktivasi, keluaran: rata(aktivasi), keluaranDasar: rata(dasar) }
}

/**
 * Apakah obat ini menolong pada mutasi tersebut, dan seberapa banyak.
 *
 * Inilah pertanyaan klinis yang sesungguhnya: obat yang bekerja DI HULU mutasi
 * tidak akan menurunkan keluaran sama sekali, betapa pun kuat ia menghambat
 * sasarannya sendiri.
 */
export function ujiObat(jalur: Jalur, mutasi: string[], obat: string): {
  tanpaObat: number
  denganObat: number
  penurunan: number
  menolong: boolean
} {
  const a = hitungJalur(jalur, { mutasi, obat: [] })
  const b = hitungJalur(jalur, { mutasi, obat: [obat] })
  const penurunan = Number((a.keluaran - b.keluaran).toFixed(4))
  return { tanpaObat: a.keluaran, denganObat: b.keluaran, penurunan, menolong: penurunan > 0.05 }
}
