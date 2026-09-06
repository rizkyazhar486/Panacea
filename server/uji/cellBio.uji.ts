// Uji sel dan metabolisme.
//
// Diagram metabolisme adalah tempat angka karangan paling aman bersembunyi:
// tidak ada yang menghitung ulang. Panah boleh terbalik, karbon boleh tidak
// seimbang, hasil ATP boleh dikarang — gambarnya tetap terlihat seperti
// biokimia. Uji ini menghitung ulang semuanya dari datanya sendiri, jadi angka
// yang saya tulis di dalam berkasnya tidak pernah dipercaya begitu saja.

import {
  ORGANEL, JALUR_METABOLIK, RANTAI, ringkasJalur, neracaGlukosa, neracaAsamLemak,
  ATP_PER_NADH, ATP_PER_FADH2, PROTON_PER_ATP,
} from '../../src/lib/cellBio'

let lulus = 0, gagal = 0
function ok(nama: string, syarat: boolean, ket = '') {
  if (syarat) { lulus++; console.log('ok    ', nama) }
  else { gagal++; console.log('GAGAL ', nama, ket) }
}
const jalur = (k: string) => JALUR_METABOLIK.find((j) => j.kunci === k)!

// ── Organel ─────────────────────────────────────────────────────────────────
ok('sebelas organel terdokumentasi', ORGANEL.length === 11)
ok('kunci organel tidak berulang', new Set(ORGANEL.map((o) => o.kunci)).size === ORGANEL.length)
ok('setiap organel punya kaitan klinis', ORGANEL.every((o) => o.klinis.length > 30))
ok('setiap organel punya ukuran positif', ORGANEL.every((o) => o.ukuranUm > 0))
// Jumlah membran bukan hiasan: dua membran adalah tanda asal-usul endosimbiotik,
// dan itu yang menjelaskan kenapa mitokondria punya DNA sendiri.
ok('mitokondria dan nukleus berselaput ganda',
  ORGANEL.find((o) => o.kunci === 'mitokondria')!.membran === 2 &&
  ORGANEL.find((o) => o.kunci === 'nukleus')!.membran === 2)
ok('lisosom dan peroksisom berselaput tunggal',
  ORGANEL.find((o) => o.kunci === 'lisosom')!.membran === 1 &&
  ORGANEL.find((o) => o.kunci === 'peroksisom')!.membran === 1)
ok('ribosom tidak berselaput', ORGANEL.find((o) => o.kunci === 'ribosom')!.membran === 0)
ok('mitokondria jauh lebih besar daripada ribosom',
  ORGANEL.find((o) => o.kunci === 'mitokondria')!.ukuranUm >
  ORGANEL.find((o) => o.kunci === 'ribosom')!.ukuranUm * 10)
ok('jalur yang disebut organel memang ada',
  ORGANEL.every((o) => o.jalur.every((k) => ['tca', 'etc', 'beta-oksidasi', 'ppp', 'glikolisis'].includes(k))))
ok('TCA dan rantai respirasi ditempatkan di mitokondria',
  ORGANEL.find((o) => o.kunci === 'mitokondria')!.jalur.includes('tca'))

// ── Glikolisis ──────────────────────────────────────────────────────────────
{
  const g = jalur('glikolisis')
  ok('glikolisis punya sepuluh tahap', g.tahap.length === 10)
  ok('tahap bernomor berurutan', g.tahap.every((t, i) => t.nomor === i + 1))
  ok('glikolisis berlangsung di sitosol', g.kompartemen === 'sitosol')

  const r = ringkasJalur(g)
  // Dua ATP dipakai, empat dihasilkan (dua tahap × dua triosa). Data hanya
  // mencatat satu lintasan triosa, jadi hasil bersihnya dihitung ulang di sini.
  ok('dua ATP dipakai di tahap investasi',
    g.tahap.filter((t) => t.atp < 0).reduce((a, t) => a + t.atp, 0) === -2)
  ok('dua tahap menghasilkan ATP per triosa',
    g.tahap.filter((t) => t.atp > 0).length === 2)
  ok('hasil bersih glikolisis 2 ATP per glukosa',
    -2 + g.tahap.filter((t) => t.atp > 0).reduce((a, t) => a + t.atp, 0) * 2 === 2)
  ok('satu NADH per triosa, dua per glukosa', r.nadh === 1 && r.nadh * 2 === 2)
  ok('glikolisis tidak menghasilkan FADH2', r.fadh2 === 0)

  // Tepat tiga tahap tak terbalikkan, dan tepat tiga itulah titik pengaturan.
  const kunciAtur = g.tahap.filter((t) => t.takTerbalikkan)
  ok('tiga tahap glikolisis tak terbalikkan', kunciAtur.length === 3)
  ok('ketiganya adalah heksokinase, PFK-1 dan piruvat kinase',
    kunciAtur.map((t) => t.nomor).join(',') === '1,3,10')
  ok('setiap tahap tak terbalikkan punya keterangan pengaturan',
    kunciAtur.every((t) => (t.pengaturan?.length ?? 0) > 20))
  // ΔG°' negatif besar adalah alasan fisik ketakterbalikannya.
  ok('tahap tak terbalikkan sangat eksergonik',
    kunciAtur.every((t) => t.deltaG < -10))
  ok('PFK-1 disebut sebagai tahap penentu laju',
    g.tahap[2].pengaturan!.includes('rate-limiting'))

  // Keseimbangan karbon: satu C6 menjadi dua C3, lalu semuanya tetap C3.
  ok('tahap 1 sampai 4 mempertahankan enam karbon',
    g.tahap.slice(0, 4).every((t) => t.karbonMasuk === 6))
  ok('setelah aldolase semuanya tiga karbon',
    g.tahap.slice(4).every((t) => t.karbonMasuk === 3 && t.karbonKeluar === 3))
  ok('tidak ada karbon hilang di glikolisis',
    g.tahap.every((t) => t.karbonMasuk === t.karbonKeluar))
  ok('glikolisis tidak melepas CO2', g.tahap.every((t) => !t.co2))

  ok('produk satu tahap menjadi substrat tahap berikutnya', (() => {
    // Rantai berhenti di tahap 4 karena aldolase memecah menjadi dua produk.
    for (let i = 0; i < 3; i++) if (g.tahap[i].produk !== g.tahap[i + 1].substrat) return false
    for (let i = 5; i < 9; i++) if (g.tahap[i].produk !== g.tahap[i + 1].substrat) return false
    return true
  })())
  ok('defisiensi piruvat kinase disebut sebagai penyebab anemia hemolitik',
    g.tahap[9].klinis!.includes('haemolytic'))
}

// ── Siklus TCA ──────────────────────────────────────────────────────────────
{
  const t = jalur('tca')
  ok('TCA punya delapan tahap', t.tahap.length === 8)
  ok('TCA berlangsung di matriks mitokondria', t.kompartemen === 'mitokondria-matriks')

  const r = ringkasJalur(t)
  ok('TCA menghasilkan 3 NADH per asetil-KoA', r.nadh === 3)
  ok('TCA menghasilkan 1 FADH2 per asetil-KoA', r.fadh2 === 1)
  ok('TCA menghasilkan 1 GTP per asetil-KoA', r.gtp === 1)
  ok('TCA tidak menghasilkan ATP langsung', r.atpLangsung === 0)
  ok('dua CO2 dilepas per putaran',
    t.tahap.reduce((a, x) => a + (x.co2 ?? 0), 0) === 2)

  // Siklus harus benar-benar menutup: mulai dari C4 + C2, kembali ke C4.
  ok('siklus kembali ke oksaloasetat',
    t.tahap[t.tahap.length - 1].produk === 'Oxaloacetate')
  ok('karbon turun dari 6 ke 4 lewat dua dekarboksilasi',
    t.tahap[0].karbonMasuk === 6 && t.tahap[t.tahap.length - 1].karbonKeluar === 4)
  ok('karbon hanya berkurang di tahap yang melepas CO2',
    t.tahap.every((x) => (x.karbonMasuk - x.karbonKeluar) === (x.co2 ?? 0)))

  ok('rantai produk-substrat TCA menyambung', (() => {
    for (let i = 1; i < t.tahap.length - 1; i++) {
      if (t.tahap[i].produk !== t.tahap[i + 1].substrat) return false
    }
    return true
  })())

  // Lima kofaktor kompleks α-KG dehidrogenase adalah alasan tiamin bekerja.
  const akg = t.tahap[3]
  ok('kompleks α-KG dehidrogenase memakai lima kofaktor', akg.kofaktor.length === 5)
  ok('tiamin pirofosfat termasuk di antaranya',
    akg.kofaktor.some((k) => k.includes('Thiamine')))
  ok('kaitan tiamin dengan ensefalopati Wernicke disebutkan',
    akg.klinis!.includes('Wernicke'))
  ok('suksinat dehidrogenase dikenali juga sebagai kompleks II',
    t.tahap[5].enzim.includes('Complex II'))
  ok('IDH disebut sebagai tahap penentu laju TCA',
    t.tahap[2].pengaturan!.includes('Rate-limiting'))
  ok('onkometabolit 2-HG disebut pada mutasi IDH',
    t.tahap[2].klinis!.includes('2-hydroxyglutarate'))
}

// ── Rantai transpor elektron ────────────────────────────────────────────────
{
  ok('lima kompleks', RANTAI.length === 5)
  const I = RANTAI.find((k) => k.nomor === 'I')!
  const II = RANTAI.find((k) => k.nomor === 'II')!
  const III = RANTAI.find((k) => k.nomor === 'III')!
  const IV = RANTAI.find((k) => k.nomor === 'IV')!

  // Inilah sebabnya FADH2 memberi ATP lebih sedikit: elektronnya masuk SETELAH
  // kompleks I, jadi empat proton kompleks I tidak pernah dipompa.
  ok('kompleks II tidak memompa proton', II.protonDipompa === 0)
  const lewatNadh = I.protonDipompa + III.protonDipompa + IV.protonDipompa
  const lewatFadh2 = III.protonDipompa + IV.protonDipompa
  ok('NADH memompa 10 proton', lewatNadh === 10)
  ok('FADH2 memompa 6 proton', lewatFadh2 === 6)
  ok('rasio P/O turun dari data protonnya sendiri',
    lewatNadh / PROTON_PER_ATP === ATP_PER_NADH && lewatFadh2 / PROTON_PER_ATP === ATP_PER_FADH2)
  ok('selisih NADH dan FADH2 tepat satu ATP', ATP_PER_NADH - ATP_PER_FADH2 === 1)

  ok('sianida bekerja di kompleks IV', IV.penghambat.includes('Cyanide'))
  ok('karbon monoksida juga di kompleks IV', IV.penghambat.includes('Carbon monoxide'))
  ok('rotenon di kompleks I', I.penghambat.includes('Rotenone'))
  ok('antimisin A di kompleks III', III.penghambat.includes('Antimycin A'))
  ok('oligomisin di ATP sintase',
    RANTAI.find((k) => k.nomor === 'V')!.penghambat.includes('Oligomycin'))
  ok('setiap kompleks punya penjelasan', RANTAI.every((k) => k.catatan.length > 30))
}

// ── Neraca ATP ──────────────────────────────────────────────────────────────
{
  const hati = neracaGlukosa('malat-aspartat')
  const otot = neracaGlukosa('gliserol-fosfat')
  ok('malat-aspartat memberi 32 ATP per glukosa', hati.total === 32, String(hati.total))
  ok('gliserol-fosfat memberi 30 ATP per glukosa', otot.total === 30, String(otot.total))
  // Perbedaannya tepat dua: dua NADH sitosolik, masing-masing kehilangan satu ATP.
  ok('selisih kedua antarjemput tepat dua ATP', hati.total - otot.total === 2)
  ok('rincian dijumlahkan, bukan diketik',
    hati.rincian.reduce((a, b) => a + b.atp, 0) === hati.total)
  ok('rincian menyebut enam sumber', hati.rincian.length === 6)
  ok('setiap sumber menyumbang positif', hati.rincian.every((r) => r.atp > 0))
  ok('catatan menyebut jaringan yang memakainya',
    hati.catatan.includes('Liver') && otot.catatan.includes('muscle'))
  // Tanpa fosforilasi tingkat substrat pun sebagian besar ATP tetap dari
  // rantai respirasi — itulah kenapa sianida membunuh begitu cepat.
  ok('lebih dari 80 persen ATP berasal dari fosforilasi oksidatif',
    (hati.total - 2 - 2) / hati.total > 0.8)
}
{
  // Palmitat C16 — angka baku dalam buku ajar adalah 106 ATP.
  const palmitat = neracaAsamLemak(16)
  ok('palmitat menghasilkan 8 asetil-KoA', palmitat.ok && palmitat.asetilKoA === 8)
  ok('palmitat menjalani 7 siklus, bukan 8', palmitat.ok && palmitat.siklus === 7)
  ok('palmitat menghasilkan 106 ATP', palmitat.ok && palmitat.total === 106, String(palmitat.total))

  // Asam lemak memberi jauh lebih banyak ATP per karbon daripada glukosa —
  // alasan lemak menjadi simpanan energi dan glikogen tidak.
  ok('palmitat memberi lebih banyak ATP per karbon daripada glukosa',
    (palmitat.total! / 16) > (neracaGlukosa().total / 6))

  const c4 = neracaAsamLemak(4)
  ok('asam lemak C4 dihitung benar', c4.ok && c4.siklus === 1 && c4.asetilKoA === 2)
  ok('asam lemak ganjil ditolak', !neracaAsamLemak(15).ok)
  ok('asam lemak terlalu pendek ditolak', !neracaAsamLemak(2).ok)
  ok('bukan bilangan bulat ditolak', !neracaAsamLemak(16.5).ok)
  ok('penolakan menyebut alasannya', (neracaAsamLemak(15).alasan?.length ?? 0) > 20)
}

console.log(`\n${lulus} lulus, ${gagal} gagal`)
if (gagal) process.exit(1)
