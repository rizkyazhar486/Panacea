// Uji inti genomika dan perancang CRISPR.
//
// Kesalahan di sini tidak pernah terlihat sebagai galat. Protein hasil
// translasi yang salah tetap terbaca seperti protein, panduan CRISPR dengan
// PAM di sisi yang keliru tetap tampak seperti panduan, dan N50 yang salah
// hitung tetap berupa angka. Hanya angka yang bisa membedakannya.

import {
  bersihkanUrutan, komplemenBalik, persenGC, terjemahkan, cariORF, suhuLeleh,
  terapkanVarian, ringkasBacaan, bacaFastq, KODON,
} from '../../src/lib/genomics'
import { rancangPanduan, templateHDR } from '../../src/lib/crispr'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}

// ── Dasar urutan ────────────────────────────────────────────────────────────
ok('FASTA dibersihkan dari judul dan spasi',
  bersihkanUrutan('>seq1 keterangan\nACGT acgt\n123GG\n') === 'ACGTACGTGG')
ok('komplemen balik benar', komplemenBalik('ATGC') === 'GCAT')
ok('komplemen balik dua kali kembali ke asal',
  komplemenBalik(komplemenBalik('ATGCCGTAGCTAGCTA')) === 'ATGCCGTAGCTAGCTA')
ok('GC dihitung benar', persenGC('GGCC') === 100 && persenGC('ATAT') === 0 && persenGC('ATGC') === 50)

// ── Tabel kodon ─────────────────────────────────────────────────────────────
ok('tabel kodon lengkap 64 kodon', Object.keys(KODON).length === 64)
ok('tiga kodon stop', Object.values(KODON).filter((x) => x === '*').length === 3)
ok('metionin hanya ATG', Object.entries(KODON).filter(([, a]) => a === 'M').length === 1)
{
  // Kode genetik degenerate: leusin, serin, dan arginin masing-masing 6 kodon.
  const hitung = (aa: string) => Object.values(KODON).filter((x) => x === aa).length
  ok('leusin, serin, arginin masing-masing enam kodon',
    hitung('L') === 6 && hitung('S') === 6 && hitung('R') === 6)
}

// ── Translasi: awal HBB yang sesungguhnya ───────────────────────────────────
// Kodon-kodon pembuka gen beta-globin manusia. Protein rujukannya diketahui:
// Met-Val-His-Leu-Thr-Pro-Glu-Glu-Lys.
const HBB_AWAL = 'ATGGTGCATCTGACTCCTGAGGAGAAG'
ok('translasi awal HBB menghasilkan MVHLTPEEK', terjemahkan(HBB_AWAL) === 'MVHLTPEEK', terjemahkan(HBB_AWAL))
ok('translasi berhenti di kodon stop', terjemahkan('ATGAAATAAGGGCCC') === 'MK')
ok('translasi tanpa berhenti melanjutkan melewati stop',
  terjemahkan('ATGAAATAAGGGCCC', false) === 'MK*GP')

// ── Varian sel sabit, dihitung dari urutannya ───────────────────────────────
{
  // HBB c.20A>T: kodon ke-7 GAG (Glu) menjadi GTG (Val) — hemoglobin S.
  const v = terapkanVarian(HBB_AWAL, 20, 'A', 'T')
  ok('varian sel sabit terbaca sebagai missense', v.jenis === 'missense', v.jenis)
  ok('sel sabit: Glu7Val', v.hgvsProtein === 'p.Glu7Val', v.hgvsProtein)
  ok('protein varian adalah MVHLTPVEK', v.proteinVarian === 'MVHLTPVEK', v.proteinVarian)
  ok('protein rujukan tidak ikut berubah', v.proteinRujukan === 'MVHLTPEEK')
}
{
  // Perubahan basa ketiga kodon yang tidak mengubah asam amino.
  const v = terapkanVarian('ATGGTGCATCTG', 12, 'G', 'A')
  ok('varian diam dikenali sebagai silent', v.jenis === 'silent', v.jenis)
}
{
  const v = terapkanVarian('ATGAAAGGGCCC', 4, 'A', 'T')
  ok('kodon stop prematur dikenali sebagai nonsense', v.jenis === 'nonsense', `${v.jenis} ${v.hgvsProtein}`)
  ok('nonsense memendekkan protein', v.proteinVarian.length < v.proteinRujukan.length)
}
{
  const v = terapkanVarian('ATGAAAGGGCCCTTT', 4, 'A', '')
  ok('delesi satu basa menggeser bingkai', v.jenis === 'frameshift', v.jenis)
}
{
  const v = terapkanVarian('ATGAAAGGGCCCTTT', 4, 'AAA', '')
  ok('delesi tiga basa tetap dalam bingkai', v.jenis === 'in-frame indel', v.jenis)
}
{
  const v = terapkanVarian('ATGAAAGGG', 1, 'A', 'G')
  ok('kehilangan kodon awal dikenali', v.jenis === 'start-lost', v.jenis)
}

// ── ORF ─────────────────────────────────────────────────────────────────────
{
  const cds = 'ATG' + 'AAA'.repeat(40) + 'TAA'
  const acak = 'CGATCGATCG'
  const orf = cariORF(acak + cds + acak, 30)
  ok('ORF ditemukan pada untai maju', orf.some((o) => o.bingkai > 0 && o.protein.length === 41),
    orf.map((o) => `${o.bingkai}:${o.protein.length}`).join(', '))
  const orfBalik = cariORF(komplemenBalik(acak + cds + acak), 30)
  ok('ORF yang sama ditemukan pada untai balik', orfBalik.some((o) => o.bingkai < 0 && o.protein.length === 41))
  ok('ORF pendek tidak dilaporkan', cariORF('ATGAAATAA', 30).length === 0)
}

// ── Suhu leleh ──────────────────────────────────────────────────────────────
{
  // ATGCATGCAT: empat G/C dan enam A/T, jadi Wallace = 2(6) + 4(4) = 28.
  // Nilainya dihitung ulang di sini, bukan ditulis sebagai angka jadi —
  // harapan uji yang diketik tangan adalah cara paling mudah menguji hal yang
  // salah dan menyebutnya lulus.
  const s = 'ATGCATGCAT'
  const gc = [...s].filter((b) => b === 'G' || b === 'C').length
  ok('Wallace untuk primer pendek', suhuLeleh(s) === 2 * (s.length - gc) + 4 * gc,
    `${suhuLeleh(s)} vs ${2 * (s.length - gc) + 4 * gc}`)
}
{
  const tm = suhuLeleh('ATGCATGCATGCATGCATGCATGCA')
  ok('primer 25 basa memberi Tm yang masuk akal', tm > 45 && tm < 70, String(tm))
  ok('primer kaya GC meleleh lebih tinggi',
    suhuLeleh('GCGCGCGCGCGCGCGCGCGCGCGCG') > suhuLeleh('ATATATATATATATATATATATATA'))
}

// ── CRISPR ──────────────────────────────────────────────────────────────────
{
  // Urutan buatan dengan satu PAM maju yang jelas: 20 nt spacer lalu AGG.
  const spacer = 'GACCTGCAGTACGATCAGTA'
  const urutan = 'TTTTTTTTTT' + spacer + 'AGG' + 'TTTTTTTTTT'
  const p = rancangPanduan(urutan)
  const maju = p.find((x) => x.untai === '+' && x.spacer === spacer)
  ok('panduan untai maju ditemukan dengan spacer yang benar', !!maju,
    p.filter((x) => x.untai === '+').map((x) => x.spacer).join(' '))
  ok('PAM yang dilaporkan adalah AGG', maju?.pam === 'AGG', maju?.pam)
  ok('posisi spacer benar (berbasis 1)', maju?.posisi === 11, String(maju?.posisi))
  // Potongan Cas9 tumpul 3 bp di hulu PAM: PAM mulai di 31, jadi potongan di 28.
  ok('letak potongan tiga basa di hulu PAM', maju?.posisiPotong === 28, String(maju?.posisiPotong))
}
{
  // Untai balik: CCN pada untai maju berarti PAM pada untai balik.
  const urutan = 'AAAA' + 'CCT' + 'ACGTACGTACGTACGTACGT' + 'AAAA'
  const p = rancangPanduan(urutan)
  const balik = p.find((x) => x.untai === '-')
  ok('panduan untai balik ditemukan', !!balik)
  ok('spacer untai balik adalah komplemen baliknya',
    balik?.spacer === komplemenBalik('ACGTACGTACGTACGTACGT'), balik?.spacer)
  ok('PAM untai balik terbaca AGG', balik?.pam === 'AGG', balik?.pam)
}
{
  // TTTT harus menurunkan skor secara berarti.
  const buruk = rancangPanduan('AAAA' + 'GACCTTTTCAGTACGATCAG' + 'TGG' + 'AAAA')
  const baik = rancangPanduan('AAAA' + 'GACCTGCAGTACGATCAGTA' + 'TGG' + 'AAAA')
  const sBuruk = buruk.find((x) => x.untai === '+')?.skor ?? 100
  const sBaik = baik.find((x) => x.untai === '+')?.skor ?? 0
  ok('panduan dengan TTTT diberi skor lebih rendah', sBuruk < sBaik, `${sBuruk} vs ${sBaik}`)
  ok('alasan penurunan skor disebutkan',
    (buruk.find((x) => x.untai === '+')?.catatan ?? []).some((c) => /TTTT/.test(c)))
}
{
  // Urutan berulang: benih yang sama muncul dua kali, harus terdeteksi.
  const blok = 'GACCTGCAGTACGATCAGTA' + 'TGG'
  const p = rancangPanduan(blok + 'ACGTACGTAC' + blok)
  ok('kecocokan benih berulang terdeteksi sebagai sasaran lain',
    p.some((x) => x.sasaranLain > 0), p.map((x) => x.sasaranLain).join(','))
}
ok('urutan tanpa PAM tidak menghasilkan panduan',
  rancangPanduan('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA').length === 0)

// ── Templat HDR ─────────────────────────────────────────────────────────────
{
  const urutan = 'ACGT'.repeat(40)
  const t = templateHDR(urutan, 80, 'A', 78, 20)
  ok('templat HDR punya kedua lengan', t?.kiri.length === 20 && t?.kanan.length === 20)
  ok('jarak ke potongan dilaporkan', t?.jarakKePotongan === 2, String(t?.jarakKePotongan))
  ok('panjang total sesuai', t?.panjangTotal === 41, String(t?.panjangTotal))
  const jauh = templateHDR(urutan, 120, 'A', 20, 20)
  ok('jarak jauh dari potongan diperingatkan',
    (jauh?.catatan ?? []).some((c) => /falls steeply/.test(c)))
}

// ── Ringkasan bacaan nanopore ───────────────────────────────────────────────
{
  const fastq = '@r1\nACGTACGTAC\n+\nIIIIIIIIII\n@r2\nACGTA\n+\nIIIII\n'
  const bacaan = bacaFastq(fastq)
  ok('FASTQ terbaca', bacaan.length === 2 && bacaan[0].seq === 'ACGTACGTAC')
  const r = ringkasBacaan(bacaan)
  ok('total basa benar', r.totalBasa === 15, String(r.totalBasa))
  // Panjang 10 dan 5: setengah dari 15 adalah 7,5 — tercapai pada bacaan 10.
  ok('N50 dihitung benar', r.n50 === 10, String(r.n50))
  // ACGTACGTAC punya 5 G/C dari 10, ACGTA punya 2 dari 5: 7/15 = 46,67%.
  ok('GC dihitung dari seluruh bacaan, bukan dirata-rata per bacaan',
    r.gcPersen === 46.67, String(r.gcPersen))
  ok("skor mutu 'I' setara Q40", r.mutuRerata === 40, String(r.mutuRerata))
}
{
  // Rata-rata mutu harus diambil atas peluang galat, bukan atas skor Phred.
  // Q40 dan Q10 dirata-rata sebagai skor memberi 25; sebagai peluang galat
  // memberi ~13, yang benar — dan jauh lebih jujur.
  const r = ringkasBacaan([{ seq: 'AA', qual: 'I+' }])
  ok('rata-rata mutu memakai peluang galat, bukan rata-rata logaritma',
    r.mutuRerata !== null && r.mutuRerata > 12 && r.mutuRerata < 14, String(r.mutuRerata))
}
ok('kumpulan bacaan kosong tidak membuat pembagian nol',
  ringkasBacaan([]).n50 === 0 && ringkasBacaan([]).mutuRerata === null)

// ── Bank varian klinis: setiap tautan diperiksa ─────────────────────────────
{
  const { VARIAN, varianUntukKondisi, varianUntukObat, labelVarian } =
    await import('../../src/lib/variantBank')
  const { DRUG_TARGETS } = await import('../../src/lib/drugTargets')
  const { SKDI_DISEASE_LIST } = await import('../../src/lib/skdiDiseaseList')
  const { CARDIO_CONDITIONS } = await import('../../src/lib/cardioPathology')
  const { SYSTEM_CONDITIONS } = await import('../../src/lib/specialtyPathology')

  ok('bank varian berisi cukup entri', VARIAN.length >= 25, String(VARIAN.length))
  ok('id varian tidak kembar', new Set(VARIAN.map((v) => v.id)).size === VARIAN.length)

  const idKeadaan = new Set([...CARDIO_CONDITIONS.map((k) => k.id), ...SYSTEM_CONDITIONS.map((k) => k.id)])
  const keadaanHilang = VARIAN.flatMap((v) => v.kondisi.filter((k) => !idKeadaan.has(k)).map((k) => `${v.id}: ${k}`))
  ok('setiap keadaan yang ditautkan ada di atlas patologi', keadaanHilang.length === 0, keadaanHilang.join(' | '))

  const idObat = new Set(DRUG_TARGETS.map((d) => d.id))
  const obatHilang = VARIAN.flatMap((v) => v.obat.filter((o) => !idObat.has(o)).map((o) => `${v.id}: ${o}`))
  ok('setiap obat yang ditautkan ada di bank obat', obatHilang.length === 0, obatHilang.join(' | '))

  const namaSkdi = new Set(SKDI_DISEASE_LIST.map((e: { disease: string }) => e.disease))
  const skdiHilang = VARIAN.flatMap((v) => v.skdi.filter((n) => !namaSkdi.has(n)).map((n) => `${v.id}: ${n}`))
  ok('setiap penyakit SKDI yang ditautkan ada di daftarnya', skdiHilang.length === 0, skdiHilang.join(' | '))

  ok('setiap varian menyebut mekanisme, tindakan, dan cara deteksinya',
    VARIAN.every((v) => v.mekanisme.length > 150 && v.tindakan.length >= 2 && v.deteksi.length > 20))
  ok('setiap varian punya penulisan varian yang dapat dikenali',
    VARIAN.every((v) => !!(v.hgvsC || v.hgvsP || v.bentukLain)))
  ok('label varian terbaca', labelVarian(VARIAN[0]).length > 3)

  // Arah pemakaian yang sebenarnya: dari obat dan dari penyakit ke variannya.
  ok('klopidogrel membawa serta CYP2C19',
    varianUntukObat('clopidogrel').some((v) => v.gen === 'CYP2C19'))
  ok('sindrom Stevens-Johnson membawa serta HLA-B*15:02',
    varianUntukKondisi('sjs').some((v) => v.id === 'hla-b1502'))
  ok('PPOK membawa serta defisiensi alfa-1 antitripsin',
    varianUntukKondisi('copd').some((v) => v.gen === 'SERPINA1'))
  ok('bidang yang diminta pengguna terwakili',
    ['haematology', 'oncology', 'pharmacogenomics', 'metabolic', 'neurodevelopmental', 'respiratory', 'bone']
      .every((b) => VARIAN.some((v) => v.bidang === b)))
}

// ── Jalur sinyal: aturan klinis harus keluar sebagai ANGKA ──────────────────
{
  const { JALUR, hitungJalur, ujiObat } = await import('../../src/lib/pathway')

  ok('ada beberapa jalur', JALUR.length >= 4)
  ok('setiap jalur punya simpul keluaran', JALUR.every((j) => j.simpul.some((s) => s.jenis === 'outcome')))
  ok('setiap sisi menunjuk simpul yang ada', JALUR.every((j) => {
    const id = new Set(j.simpul.map((s) => s.id))
    return j.sisi.every((e) => id.has(e.dari) && id.has(e.ke))
  }))
  ok('setiap mutasi dan penghambat menunjuk simpul yang ada', JALUR.every((j) => {
    const id = new Set(j.simpul.map((s) => s.id))
    return j.mutasi.every((m) => id.has(m.simpul)) && j.penghambat.every((o) => id.has(o.simpul))
  }))

  const ras = JALUR.find((j) => j.id === 'ras-mapk')!
  const tenang = hitungJalur(ras, { mutasi: [], obat: [] })
  ok('jalur tenang memberi keluaran rendah', tenang.keluaran < 0.5, String(tenang.keluaran))
  ok('keaktifan selalu di dalam 0..1',
    Object.values(tenang.aktivasi).every((v) => v >= 0 && v <= 1))

  const kras = hitungJalur(ras, { mutasi: ['kras-g12c'], obat: [] })
  ok('mutasi KRAS menaikkan keluaran', kras.keluaran > tenang.keluaran + 0.3,
    `${tenang.keluaran} -> ${kras.keluaran}`)
  ok('mutasi mengunci simpulnya menjadi aktif penuh', kras.aktivasi['kras'] === 1)
  ok('simpul di HULU mutasi tidak ikut naik', kras.aktivasi['egfr'] === tenang.aktivasi['egfr'])

  // Inti klinisnya: obat di hulu mutasi tidak menolong, obat di hilir menolong.
  const hulu = ujiObat(ras, ['kras-g12c'], 'cetuximab')
  const hilir = ujiObat(ras, ['kras-g12c'], 'trametinib')
  ok('anti-EGFR tidak menolong pada mutasi KRAS', !hulu.menolong && hulu.penurunan === 0,
    JSON.stringify(hulu))
  ok('penghambat MEK menolong pada mutasi KRAS', hilir.menolong && hilir.penurunan > 0.3,
    JSON.stringify(hilir))
  ok('anti-EGFR menolong kalau mutasinya memang di EGFR',
    ujiObat(ras, ['egfr-l858r'], 'cetuximab').menolong)
  ok('penghambat BRAF menolong pada mutasi BRAF',
    ujiObat(ras, ['braf-v600e'], 'vemurafenib').menolong)
  // BRAF berada di HILIR KRAS, jadi menghambatnya tetap menolong pada mutasi
  // KRAS di dalam model ini — dan memang itu yang diamati secara klinis untuk
  // penghambat MEK; untuk penghambat BRAF kenyataannya lebih rumit (aktivasi
  // paradoksal pada sel BRAF normal), dan model sesederhana ini tidak
  // menangkapnya. Batas itu ditulis di sini supaya tidak dikira tertangkap.
  ok('menghambat di hilir mutasi menurunkan keluaran',
    ujiObat(ras, ['kras-g12c'], 'vemurafenib').penurunan > 0)

  const jak = JALUR.find((j) => j.id === 'jak-stat')!
  ok('JAK2 V617F menaikkan eritropoiesis',
    hitungJalur(jak, { mutasi: ['jak2-v617f'], obat: [] }).keluaran >
    hitungJalur(jak, { mutasi: [], obat: [] }).keluaran)
  ok('penghambat JAK menurunkannya kembali', ujiObat(jak, ['jak2-v617f'], 'ruxolitinib').menolong)

  const abl = JALUR.find((j) => j.id === 'bcr-abl')!
  ok('imatinib menekan BCR::ABL1', ujiObat(abl, ['bcr-abl1'], 'imatinib').penurunan > 0.5)

  const pi3k = JALUR.find((j) => j.id === 'pi3k-akt')!
  const ptenHilang = hitungJalur(pi3k, { mutasi: ['pten-loss'], obat: [] })
  ok('kehilangan PTEN dimodelkan sebagai simpul MATI, bukan menyala',
    ptenHilang.aktivasi['pten'] === 0, String(ptenHilang.aktivasi['pten']))
  ok('kehilangan rem tetap menaikkan keluaran',
    ptenHilang.keluaran > hitungJalur(pi3k, { mutasi: [], obat: [] }).keluaran)

  // Hasil tidak boleh bergantung pada urutan penulisan simpul di dalam berkas.
  const acak = { ...ras, simpul: [...ras.simpul].reverse() }
  ok('hasil tidak bergantung urutan penulisan simpul',
    hitungJalur(acak, { mutasi: ['kras-g12c'], obat: ['trametinib'] }).keluaran ===
    hitungJalur(ras, { mutasi: ['kras-g12c'], obat: ['trametinib'] }).keluaran)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
