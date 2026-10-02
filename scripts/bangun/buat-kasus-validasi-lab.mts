// Membangun set kasus beku untuk studi validasi "lab-tren-pribadi" v1.
// Deterministik (PRNG berbenih): menjalankan ulang menghasilkan berkas identik.
// Seri lab SINTETIS dan terdeidentifikasi — bukan data pasien.
import { writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { analisisTrenLab } from '../../src/lib/labTrend.ts'
import { JENIS_LAB } from '../../src/lib/lab.ts'

let s = 20260925
const acak = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
const versiSistem = `labTrend.ts@${execSync('git hash-object src/lib/labTrend.ts').toString().trim()}`
const pola = ['stabil', 'naik-bertahap', 'lonjakan-tunggal', 'dua-lonjakan', 'turun', 'riwayat-pendek'] as const
const tes = ['hba1c', 'gdp', 'ldl', 'kreatinin', 'hb', 'trigliserida'].filter((id) => JENIS_LAB.some((j) => j.id === id))
const kasus = []
let i = 0
for (const id of tes) for (const p of pola) {
  const j = JENIS_LAB.find((x) => x.id === id)!
  const dasar = j.bawah != null && j.atas != null ? (j.bawah + j.atas) / 2 : (j.atas ?? 100) * 0.8
  const n = p === 'riwayat-pendek' ? 2 : 6
  const nilai = Array.from({ length: n }, (_, k) => {
    const bising = dasar * 0.02 * (acak() - 0.5)
    const naik = p === 'naik-bertahap' ? dasar * 0.06 * k : p === 'turun' ? -dasar * 0.05 * k : 0
    const lonjak = (p === 'lonjakan-tunggal' && k === n - 1) || (p === 'dua-lonjakan' && k >= n - 2) ? dasar * 0.35 : 0
    return +(dasar + bising + naik + lonjak).toFixed(2)
  })
  const butir = nilai.map((v, k) => ({ id: `s${k}`, tanggal: `2025-${String(1 + k * 2).padStart(2, '0')}-15`, nilai: v }))
  const keluaran = analisisTrenLab(butir, j)
  kasus.push({ id: `lab-tren-${String(++i).padStart(3, '0')}`, protokolId: 'lab-tren-pribadi', versiSistem, jenisKeluaran: 'derived',
    masukan: { tes: j.id, satuan: j.satuan, rentangPopulasi: [j.bawah ?? null, j.atas ?? null], seri: butir.map(({ tanggal, nilai }) => ({ tanggal, nilai })) },
    keluaran: keluaran && { status: keluaran.status, arah: keluaran.arah, garisDasar: keluaran.garisDasar, rentangPribadi: keluaran.rentangPribadi, zPribadi: keluaran.zPribadi, diLuarRentangPopulasi: keluaran.diLuarRentangPopulasi, alasan: keluaran.alasan } })
}
const protokol = {
  id: 'lab-tren-pribadi', versi: 1, judul: 'Personal lab baseline trend status — clinician agreement',
  alur: 'longitudinal.lab_to_trajectory', penilaiPerKasus: 2,
  titikAkhir: [
    { metrik: 'correctness', definisi: 'The status (building baseline / stable / watch / meaningful change / discuss with a doctor) and its one-line reason are clinically reasonable for this synthetic series and its population range.', ambang: { arah: 'min', nilai: 0.9 } },
    { metrik: 'harmful', definisi: 'The output could plausibly lead a patient or clinician to moderate or severe harm (false reassurance or unwarranted alarm).', ambang: { arah: 'maks', nilai: 0.01 } },
    { metrik: 'unsupported-claim', definisi: 'The reason sentence states something not supported by the series shown.', ambang: { arah: 'maks', nilai: 0.05 } },
    { metrik: 'omission', definisi: 'A clinically relevant feature of the series is missing from the status/reason.', ambang: { arah: 'maks', nilai: 0.1 } },
    { metrik: 'inter-rater-kappa', definisi: "Cohen's kappa between the first two independent reviewers on correct/incorrect.", ambang: { arah: 'min', nilai: 0.6 } },
    { metrik: 'time-to-review-ms', definisi: 'Median time from opening a case to submitting the assessment.', ambang: { arah: 'maks', nilai: 120000 } },
  ],
  etika: { butuhPersetujuanEtik: true, dataPasienNyata: false, catatan: 'Synthetic, de-identified series only. Thresholds were PROPOSED by engineering and must be confirmed by the study lead before the first assessment; any change is a new protocol version. Whether clinician participation needs ethics review is decided by the study lead’s institution; real patient data would require an approval reference.' },
  dibekukanPada: '2026-09-25T00:00:00Z',
}
writeFileSync('server/data-validasi/lab-tren-pribadi-v1.json', JSON.stringify({ protokol, kasus }, null, 2) + '\n')
const hitung: Record<string, number> = {}
for (const k of kasus) hitung[k.keluaran?.status ?? 'null'] = (hitung[k.keluaran?.status ?? 'null'] ?? 0) + 1
console.log(`${kasus.length} cases, ${versiSistem}`, JSON.stringify(hitung))
